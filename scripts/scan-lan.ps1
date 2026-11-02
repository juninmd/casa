param(
  [string]$Prefix = '192.168.1',
  [string]$Out = "$PSScriptRoot\..\research\lan-scan.json"
)
# Read-only LAN discovery: ICMP sweep, ARP table, TCP connect on common IoT ports, SSDP, mDNS.
$ErrorActionPreference = 'SilentlyContinue'
$ports = 21,22,23,53,80,81,443,554,1400,1883,1900,3000,4000,5000,5353,5357,6668,7000,8000,8001,8002,8008,8009,8080,8081,8123,8443,8883,8888,9000,9100,9999,10001,15672,49152,55443
$ips = 1..254 | ForEach-Object { "$Prefix.$_" }

# 1) ICMP sweep fills the ARP cache even for hosts that block ping replies.
$alive = $ips | ForEach-Object -Parallel {
  $p = [System.Net.NetworkInformation.Ping]::new()
  try { if ($p.Send($_, 600).Status -eq 'Success') { $_ } } catch {}
} -ThrottleLimit 80

# 2) Neighbor table (ARP) = hosts that answered at L2 even if ICMP is filtered.
$arp = Get-NetNeighbor -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -like "$Prefix.*" -and $_.State -notin 'Unreachable','Incomplete' -and $_.LinkLayerAddress -and $_.LinkLayerAddress -ne 'FF-FF-FF-FF-FF-FF' -and $_.IPAddress -ne "$Prefix.255"
}
$hosts = @($alive) + @($arp.IPAddress) | Sort-Object { [version]$_ } -Unique

# 3) Ports + reverse DNS per host.
$rows = $hosts | ForEach-Object -Parallel {
  $ip = $_
  $open = foreach ($port in $using:ports) {
    $c = [System.Net.Sockets.TcpClient]::new()
    try {
      $t = $c.ConnectAsync($ip, $port)
      if ($t.Wait(350) -and $c.Connected) { $port }
    } catch {} finally { $c.Dispose() }
  }
  $name = try { [System.Net.Dns]::GetHostEntry($ip).HostName } catch { $null }
  [pscustomobject]@{ ip = $ip; hostname = $name; ports = @($open) }
} -ThrottleLimit 24

# 4) SSDP M-SEARCH (UPnP) for 3s.
$ssdp = @()
$udp = [System.Net.Sockets.UdpClient]::new()
$udp.Client.ReceiveTimeout = 1000
$msg = "M-SEARCH * HTTP/1.1`r`nHOST: 239.255.255.250:1900`r`nMAN: `"ssdp:discover`"`r`nMX: 2`r`nST: ssdp:all`r`n`r`n"
$b = [Text.Encoding]::ASCII.GetBytes($msg)
[void]$udp.Send($b, $b.Length, '239.255.255.250', 1900)
$end = (Get-Date).AddSeconds(3)
while ((Get-Date) -lt $end) {
  try {
    $ep = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
    $r = [Text.Encoding]::ASCII.GetString($udp.Receive([ref]$ep))
    $ssdp += [pscustomobject]@{ ip = $ep.Address.ToString(); server = ([regex]::Match($r, '(?im)^SERVER:\s*(.+)$').Groups[1].Value.Trim()); st = ([regex]::Match($r, '(?im)^ST:\s*(.+)$').Groups[1].Value.Trim()); location = ([regex]::Match($r, '(?im)^LOCATION:\s*(.+)$').Groups[1].Value.Trim()) }
  } catch { }
}
$udp.Close()

# 5) mDNS PTR for _services._dns-sd._udp.local.
$mdns = @()
$m = [System.Net.Sockets.UdpClient]::new()
$m.Client.ReceiveTimeout = 1000
$q = [byte[]](0,0,0,0,0,1,0,0,0,0,0,0) + [byte[]](9) + [Text.Encoding]::ASCII.GetBytes('_services') + [byte[]](7) + [Text.Encoding]::ASCII.GetBytes('_dns-sd') + [byte[]](4) + [Text.Encoding]::ASCII.GetBytes('_udp') + [byte[]](5) + [Text.Encoding]::ASCII.GetBytes('local') + [byte[]](0,0,12,0,1)
[void]$m.Send($q, $q.Length, '224.0.0.251', 5353)
$end = (Get-Date).AddSeconds(3)
while ((Get-Date) -lt $end) {
  try {
    $ep = [System.Net.IPEndPoint]::new([System.Net.IPAddress]::Any, 0)
    $r = $m.Receive([ref]$ep)
    $txt = [Text.Encoding]::ASCII.GetString($r) -replace '[^\x20-\x7E]', '.'
    $mdns += [pscustomobject]@{ ip = $ep.Address.ToString(); raw = $txt.Substring(0, [Math]::Min(200, $txt.Length)) }
  } catch { }
}
$m.Close()

$result = [pscustomobject]@{
  scannedAt = (Get-Date).ToString('o')
  subnet = "$Prefix.0/24"
  hosts = @($rows | ForEach-Object {
    $ip = $_.ip
    $mac = ($arp | Where-Object IPAddress -eq $ip | Select-Object -First 1).LinkLayerAddress
    [pscustomobject]@{ ip = $ip; mac = $mac; hostname = $_.hostname; ports = $_.ports
      ssdp = @($ssdp | Where-Object ip -eq $ip | Select-Object -Property server, st, location -Unique)
      mdns = @($mdns | Where-Object ip -eq $ip | Select-Object -ExpandProperty raw -Unique) }
  })
}
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
$result | ConvertTo-Json -Depth 6 | Set-Content -Encoding utf8 $Out
"hosts=$($result.hosts.Count) ssdpReplies=$($ssdp.Count) mdnsReplies=$($mdns.Count) -> $Out"
