export const poolIds = [
  '/rest/v0/pools/b7569d99-30f8-178a-7d94-801de3e29b5b',
  '/rest/v0/pools/355ee47d-ff4c-4924-3db2-fd86ae629676',
]

export const partialPools = [
  {
    auto_poweron: true,
    name_label: 'XCP 8.3.0 XO Team',
    id: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
    href: '/rest/v0/pools/b7569d99-30f8-178a-7d94-801de3e29b5b',
  },
  {
    auto_poweron: true,
    name_label: 'XO Lab',
    id: '355ee47d-ff4c-4924-3db2-fd86ae629676',
    href: '/rest/v0/pools/355ee47d-ff4c-4924-3db2-fd86ae629676',
  },
]

export const pool = {
  auto_poweron: true,
  crashDumpSr: '86a9757d-9c05-9fe0-e79a-8243cb1f37f3',
  current_operations: {},
  default_SR: '86a9757d-9c05-9fe0-e79a-8243cb1f37f3',
  HA_enabled: false,
  haSrs: [],
  master: '438aca0f-429c-4ae6-accc-93c306e636a0',
  tags: [],
  name_description: 'Main Lyon Lab',
  name_label: 'XO Lab',
  xosanPackInstallationTime: null,
  otherConfig: {
    'xo:clientInfo:v9sc05bvrh':
      '{"lastConnected":1744102763392,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:218b43e8-5622-4d81-adce-69be4252c4de':
      '{"lastConnected":1744102538271,"networkInterfaces":{"wlp0s20f3":[{"address":"10.234.213.181","netmask":"255.255.255.0","family":"IPv4","mac":"6a:8e:98:da:15:36","internal":false,"cidr":"10.234.213.181/24"},{"address":"2a0d:e487:319f:7520:16da:8a1a:c6fb:7fc3","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"6a:8e:98:da:15:36","internal":false,"cidr":"2a0d:e487:319f:7520:16da:8a1a:c6fb:7fc3/64","scopeid":0},{"address":"fe80::9400:57c5:e2d:94ff","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"6a:8e:98:da:15:36","internal":false,"cidr":"fe80::9400:57c5:e2d:94ff/64","scopeid":2}],"wg1":[{"address":"10.200.205.81","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.81/24"}],"wg0":[{"address":"10.200.200.81","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.81/24"}]}}',
    'xo:clientInfo:1gywgvavm02':
      '{"lastConnected":1744102486813,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:5vtpi83kh8a':
      '{"lastConnected":1744102149901,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:t0yxso5g6s':
      '{"lastConnected":1744101989898,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:0w4we05jsnof':
      '{"lastConnected":1744101895389,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:wp0r9dsmnbf':
      '{"lastConnected":1744101746158,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:p7r15qcczse':
      '{"lastConnected":1744101242926,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:1mnh07a7l2x':
      '{"lastConnected":1744101089247,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:ou6a9jn1dxa':
      '{"lastConnected":1744100523539,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:d6363a9d-03e5-f598-ebe6-b98b4fcf4ea6':
      '{"lastConnected":1744098018490,"networkInterfaces":{"eth0":[{"address":"172.16.210.100","netmask":"255.255.254.0","family":"IPv4","mac":"c2:f3:1b:b6:9f:b1","internal":false,"cidr":"172.16.210.100/23"},{"address":"2a01:240:ab08:4:c0f3:1bff:feb6:9fb1","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"c2:f3:1b:b6:9f:b1","internal":false,"cidr":"2a01:240:ab08:4:c0f3:1bff:feb6:9fb1/64","scopeid":0},{"address":"fe80::c0f3:1bff:feb6:9fb1","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"c2:f3:1b:b6:9f:b1","internal":false,"cidr":"fe80::c0f3:1bff:feb6:9fb1/64","scopeid":2}],"eth1":[{"address":"10.1.0.100","netmask":"255.255.0.0","family":"IPv4","mac":"1e:ba:68:4f:28:82","internal":false,"cidr":"10.1.0.100/16"},{"address":"2a01:240:ab08:5:1::100","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"1e:ba:68:4f:28:82","internal":false,"cidr":"2a01:240:ab08:5:1::100/64","scopeid":0},{"address":"fe80::1cba:68ff:fe4f:2882","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"1e:ba:68:4f:28:82","internal":false,"cidr":"fe80::1cba:68ff:fe4f:2882/64","scopeid":3}]}}',
    'xo:clientInfo:mz05bzlp2d9':
      '{"lastConnected":1744096801517,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:vuy2k7qxs1d':
      '{"lastConnected":1744096735180,"networkInterfaces":{"wlp58s0":[{"address":"192.168.1.22","netmask":"255.255.255.0","family":"IPv4","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"192.168.1.22/24"},{"address":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"2a01:cb15:8411:4700:4aff:d5e9:6604:f90b/64","scopeid":0},{"address":"fe80::1d04:d88d:50de:799a","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"be:7b:03:70:e6:fe","internal":false,"cidr":"fe80::1d04:d88d:50de:799a/64","scopeid":2}],"wg-grenoble":[{"address":"10.200.205.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.205.115/24"}],"wg-lyon":[{"address":"10.200.200.115","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.115/24"}]}}',
    'xo:clientInfo:218b43e8-5622-4d81-adce-69be4252c4df':
      '{"lastConnected":1744096374953,"networkInterfaces":{"wlp2s0":[{"address":"192.168.0.18","netmask":"255.255.255.0","family":"IPv4","mac":"9c:b6:d0:94:f0:43","internal":false,"cidr":"192.168.0.18/24"},{"address":"fe80::c233:3934:9928:1120","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"9c:b6:d0:94:f0:43","internal":false,"cidr":"fe80::c233:3934:9928:1120/64","scopeid":2}],"wg0":[{"address":"10.200.200.9","netmask":"255.255.255.0","family":"IPv4","mac":"00:00:00:00:00:00","internal":false,"cidr":"10.200.200.9/24"}],"enx001cc25011b2":[{"address":"192.168.0.15","netmask":"255.255.255.0","family":"IPv4","mac":"00:1c:c2:50:11:b2","internal":false,"cidr":"192.168.0.15/24"},{"address":"fe80::2f62:2392:9f4d:ca13","netmask":"ffff:ffff:ffff:ffff::","family":"IPv6","mac":"00:1c:c2:50:11:b2","internal":false,"cidr":"fe80::2f62:2392:9f4d:ca13/64","scopeid":5}],"wg2":[{"address":"fdab:cdea:bcde:e7c8::9","netmask":"ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff","family":"IPv6","mac":"00:00:00:00:00:00","internal":false,"cidr":"fdab:cdea:bcde:e7c8::9/128","scopeid":0}]}}',
    auto_poweron: 'true',
    migrationCompression: 'true',
    'xo:backupNetwork': '6c4e1cdc-9fe0-0603-e53d-4790d1fce8dd',
    jft: 'test',
    'xo:355ee47d': '{"bar":1,"foo":1}',
    'memory-ratio-hvm': '0.25',
    'xo:appliance:218b43e8-5622-4d81-adce-69be4252c4df': '{"lastConnected":1644397147011}',
    'xscontainer-public-secret-uuid': 'd95d1d3c-29b9-e1b3-1c03-5d27ab82ef76',
    'memory-ratio-pv': '0.25',
    'xscontainer-private-secret-uuid': '68c7c1a0-eb42-f21a-e872-7a19468dbd6d',
  },
  cpus: {
    cores: 120,
    sockets: 6,
  },
  zstdSupported: true,
  vtpmSupported: false,
  platform_version: '3.2.1',
  id: '355ee47d-ff4c-4924-3db2-fd86ae629676',
  type: 'pool',
  uuid: '355ee47d-ff4c-4924-3db2-fd86ae629676',
  $pool: '355ee47d-ff4c-4924-3db2-fd86ae629676',
  $poolId: '355ee47d-ff4c-4924-3db2-fd86ae629676',
  _xapiRef: 'OpaqueRef:1c3f19c8-f80a-464d-9c48-a2c19d4e4fc3',
}
