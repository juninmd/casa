//! Tapo "AES passthrough" crypto, as read from python-kasa's aestransport.py:
//! RSA-1024 keypair -> device returns key||iv encrypted with PKCS1v15 -> AES-128-CBC/PKCS7
//! (fixed IV for the whole session) -> base64. Pure functions, no I/O.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use cbc::cipher::{block_padding::Pkcs7, BlockModeDecrypt, BlockModeEncrypt, KeyIvInit};
use rsa::{pkcs8::EncodePublicKey, rand_core::OsRng, Pkcs1v15Encrypt, RsaPrivateKey};
use sha1::{Digest, Sha1};

type Enc = cbc::Encryptor<aes::Aes128>;
type Dec = cbc::Decryptor<aes::Aes128>;

pub fn sha1_hex(s: &str) -> String {
    Sha1::digest(s.as_bytes()).iter().map(|b| format!("{b:02x}")).collect()
}

/// `login_device` params. Username is always b64(sha1hex(user)); the password is
/// b64(sha1hex(pw)) under `password2` (login v2) or b64(pw) under `password` (v1).
pub fn login_params(user: &str, pass: &str, v2: bool) -> serde_json::Value {
    let username = B64.encode(sha1_hex(user));
    if v2 {
        serde_json::json!({ "username": username, "password2": B64.encode(sha1_hex(pass)) })
    } else {
        serde_json::json!({ "username": username, "password": B64.encode(pass) })
    }
}

pub struct Keypair(RsaPrivateKey);

impl Keypair {
    pub fn generate() -> Result<Self, String> {
        RsaPrivateKey::new(&mut OsRng, 1024).map(Self).map_err(|e| format!("falha ao gerar chave RSA: {e}"))
    }

    /// PEM exactly as the device expects: single-line base64 body, `\n` separators.
    pub fn public_pem(&self) -> Result<String, String> {
        let der = self.0.to_public_key().to_public_key_der().map_err(|e| e.to_string())?;
        Ok(format!("-----BEGIN PUBLIC KEY-----\n{}\n-----END PUBLIC KEY-----\n", B64.encode(der.as_bytes())))
    }

    /// Decrypts the handshake `result.key` into the session cipher.
    pub fn open_session(&self, key_b64: &str) -> Result<AesSession, String> {
        let enc = B64.decode(key_b64).map_err(|_| "chave do handshake não é base64")?;
        let raw = self.0.decrypt(Pkcs1v15Encrypt, &enc).map_err(|_| "handshake: RSA inválido")?;
        let raw: [u8; 32] = raw.try_into().map_err(|_| "handshake: chave com tamanho inesperado")?;
        Ok(AesSession { key: raw[..16].try_into().unwrap(), iv: raw[16..].try_into().unwrap() })
    }
}

#[derive(Clone)]
pub struct AesSession {
    key: [u8; 16],
    iv: [u8; 16],
}

impl AesSession {
    #[cfg(test)]
    pub fn from_parts(key: [u8; 16], iv: [u8; 16]) -> Self {
        Self { key, iv }
    }

    pub fn encrypt(&self, plain: &str) -> String {
        let ct = Enc::new(&self.key.into(), &self.iv.into()).encrypt_padded_vec::<Pkcs7>(plain.as_bytes());
        B64.encode(ct)
    }

    pub fn decrypt(&self, b64: &str) -> Result<String, String> {
        let ct = B64.decode(b64).map_err(|_| "resposta cifrada não é base64")?;
        let pt = Dec::new(&self.key.into(), &self.iv.into())
            .decrypt_padded_vec::<Pkcs7>(&ct)
            .map_err(|_| "falha ao decifrar a resposta (sessão expirada?)")?;
        String::from_utf8(pt).map_err(|_| "resposta decifrada não é UTF-8".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha1_hex_matches_the_known_vector() {
        assert_eq!(sha1_hex("test"), "a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
    }

    #[test]
    fn login_params_follow_the_two_documented_shapes() {
        let v2 = login_params("test", "pw", true);
        assert_eq!(v2["username"], B64.encode("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3"));
        assert_eq!(v2["password2"], B64.encode(sha1_hex("pw")));
        assert!(v2.get("password").is_none());
        let v1 = login_params("test", "pw", false);
        assert_eq!(v1["password"], B64.encode("pw"));
        assert!(v1.get("password2").is_none());
    }

    #[test]
    fn aes_roundtrip_is_deterministic_for_a_fixed_iv_and_handles_unicode() {
        let s = AesSession::from_parts([7; 16], [9; 16]);
        let msg = r#"{"method":"get_device_info","nome":"Tomada da sala ☀"}"#;
        assert_eq!(s.encrypt(msg), s.encrypt(msg));
        assert_eq!(s.decrypt(&s.encrypt(msg)).unwrap(), msg);
    }

    #[test]
    fn tampered_or_garbage_ciphertext_is_an_error_not_a_panic() {
        let s = AesSession::from_parts([1; 16], [2; 16]);
        assert!(s.decrypt("%%%").is_err());
        assert!(s.decrypt(&B64.encode([0u8; 16])).is_err());
        assert!(s.decrypt("").is_err());
    }

    #[test]
    fn public_pem_has_the_device_expected_framing() {
        let pem = Keypair::generate().unwrap().public_pem().unwrap();
        assert!(pem.starts_with("-----BEGIN PUBLIC KEY-----\n") && pem.ends_with("\n-----END PUBLIC KEY-----\n"));
        assert_eq!(pem.matches('\n').count(), 3, "body must be a single line");
    }
}
