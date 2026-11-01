import { describe, expect, test } from "bun:test";
import { LAN_FIXTURE } from "../data/lan-fixture";
import { classify, isPrivateMac, vendorOf } from "./classify";

const byIp = (ip: string) => {
  const h = LAN_FIXTURE.find((x) => x.ip === ip);
  if (!h) throw new Error(`fixture missing ${ip}`);
  return classify(h);
};

describe("vendor lookup", () => {
  test("resolves OUI regardless of separator or case", () => {
    expect(vendorOf("20-e1-5d-aa-bb-cc")).toMatch(/tp-link/i);
    expect(vendorOf("20:E1:5D:AA:BB:CC")).toMatch(/tp-link/i);
  });
  test("null/unknown MAC yields empty vendor, not a crash", () => {
    expect(vendorOf(null)).toBe("");
    expect(vendorOf("00-00-00-00-00-00")).toBe("");
  });
  test("detects locally-administered (randomized) MACs", () => {
    expect(isPrivateMac("7A-D1-5C-00-00-04")).toBe(true);
    expect(isPrivateMac("A8-29-48-00-00-01")).toBe(false);
    expect(isPrivateMac(null)).toBe(false);
  });
});

describe("classify real-LAN fixture", () => {
  test("gateway is a router with high confidence", () => {
    expect(byIp("192.168.1.1")).toMatchObject({ kind: "router", confidence: "alta" });
  });
  test("SHIP 2.0 TP-Link hosts are Tapo/Kasa switches", () => {
    for (const ip of ["11", "12", "16", "19"]) {
      expect(byIp(`192.168.1.${ip}`)).toMatchObject({
        kind: "switch",
        integration: expect.stringContaining("tapo"),
      });
    }
  });
  test("RTSP port marks cameras, Intelbras named", () => {
    expect(byIp("192.168.1.17")).toMatchObject({ kind: "camera", label: "Câmera Intelbras" });
    expect(byIp("192.168.1.8").kind).toBe("camera");
  });
  test("Tuya on 6668 is high confidence and needs a local key", () => {
    const c = byIp("192.168.1.21");
    expect(c.confidence).toBe("alta");
    expect(c.integration).toContain("local key");
  });
  test("Amazon + 55443 is Echo (with or without 8009)", () => {
    expect(byIp("192.168.1.14").kind).toBe("speaker");
    expect(byIp("192.168.1.22").kind).toBe("speaker");
  });
  test("randomized MAC is a phone, silent hosts stay low confidence", () => {
    expect(byIp("192.168.1.4").kind).toBe("phone");
    expect(byIp("192.168.1.13").confidence).toBe("baixa");
  });
  test("every result carries at least one reason (explainable)", () => {
    for (const h of LAN_FIXTURE) expect(classify(h).reasons.length).toBeGreaterThan(0);
  });
});
