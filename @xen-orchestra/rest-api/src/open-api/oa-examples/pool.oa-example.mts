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

export const importVm = { id: '9fe12ca3-d75d-cfb0-492e-cfd2bc6c568f' }

export const createVm = {
  id: '8279e670-cb58-c048-7007-230f075becfb',
}

export const poolStats = {
  '6278d39b-f972-43b0-a1f8-d31dc2beb923': {
    error: {
      code: 'HOST_OFFLINE',
      params: ['OpaqueRef:9a9b0a02-e888-4eaf-9d8c-127cfd8e5d9e'],
      call: {
        duration: 158,
        method: 'host.get_servertime',
        params: ['* session id *', 'OpaqueRef:9a9b0a02-e888-4eaf-9d8c-127cfd8e5d9e'],
      },
    },
  },
  '0e21d25b-4487-4f63-b0d1-2d0f6bf5aa7f': {
    endTimestamp: 1751031135,
    interval: 5,
    stats: {
      memory: [
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280, 4286177280,
        4286177280,
      ],
      memoryFree: [
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816, 2670882816,
        2670882816,
      ],
      cpus: {
        '0': [
          10.07, 9.56, 8.88, 9.6, 10.31, 8.88, 9.36, 9.84, 10.459999999999999, 10.299999999999999, 11.48,
          9.719999999999999, 8.35, 8.63, 9.44, 10.059999999999999, 10.34, 8.81, 8.5, 8.89, 10, 11.12,
          12.120000000000001, 9.92, 9.21, 9.58, 9.719999999999999, 9.85, 10.979999999999999, 9.950000000000001, 10.54,
          10.84, 10.290000000000001, 11.74, 12.18, 10.22, 8.559999999999999, 9.25, 9.53, 11.64, 15.24, 9.82, 9.78, 9.19,
          9.71, 10.040000000000001, 11.129999999999999, 9.06, 9.28, 9.53, 9.629999999999999, 9.77, 10.96, 10.32, 9.3,
          9.65, 14.41, 26.479999999999997, 30.159999999999997, 20.29, 17.09, 15.43, 14.37, 11.23, 10.27, 9.4,
          8.649999999999999, 13.020000000000001, 18.86, 9.27, 11.27, 10.81, 11.23, 12.85, 11.19, 9.370000000000001,
          10.59, 10.39, 10.82, 10.79, 14.04, 10.83, 11.83, 9.5, 9.77, 9.48, 9.59, 13.36, 20.49, 8.57, 11.03, 17.01,
          18.05, 10.549999999999999, 13.100000000000001, 10.18, 10.38, 9.27, 10.93, 11.05, 11.59, 12.11,
          15.459999999999999, 10.290000000000001, 11.469999999999999, 20.5, 12.36, 10.31, 9.27, 8.97, 10.51,
          9.959999999999999, 11.4, 10.65, 8.82, 8.67, 9.93, 16.12,
        ],
        '1': [
          9.04, 8.57, 8.52, 9.44, 10.15, 9.790000000000001, 9.53, 9.120000000000001, 8.75, 9.47, 9.8, 8.82,
          9.959999999999999, 10.03, 9.01, 9.36, 10.23, 10.36, 10.68, 9.62, 9.25, 9.26, 9.29, 9.34, 9.120000000000001,
          9.139999999999999, 9.520000000000001, 9.47, 9.78, 8.09, 7.7299999999999995, 7.430000000000001, 8.35, 8.73,
          9.85, 9.6, 9.82, 9.04, 8.93, 11.12, 14.17, 7.86, 8.59, 9.35, 8.34, 9.47, 10.620000000000001, 9.75,
          9.629999999999999, 9.34, 9.94, 9.73, 9.86, 8.57, 9.04, 9.22, 12.24, 21.93, 21.59, 13.19, 18.529999999999998,
          12, 11.200000000000001, 10.94, 10.26, 9.87, 9.879999999999999, 9.83, 15.18, 9.520000000000001,
          11.129999999999999, 11.84, 11.05, 9.66, 8.18, 7.91, 10.33, 9.120000000000001, 9.3, 9.92, 15.290000000000001,
          9.049999999999999, 9.17, 9.180000000000001, 8.37, 9.11, 9.54, 11, 18.32, 9.049999999999999, 11.51,
          15.939999999999998, 11.08, 9.41, 10.780000000000001, 9.51, 8.37, 9.180000000000001, 9.39, 8.03, 9.85, 10.36,
          13.98, 9.39, 9.950000000000001, 10.84, 10.280000000000001, 8.12, 9.69, 8.780000000000001, 9.69, 9.48, 9.34,
          7.79, 9.47, 9.29, 10.7, 17.66,
        ],
      },
      load: [
        0.1463, 0.1364, 0.1264, 0.1164, 0.135, 0.1729, 0.1565, 0.1465, 0.1365, 0.1265, 0.1165, 0.1065, 0.0966, 0.0866,
        0.08, 0.0766, 0.0666, 0.06, 0.0567, 0.05, 0.0467, 0.04, 0.04, 0.0368, 0.03, 0.03, 0.03, 0.0268, 0.02, 0.02,
        0.02, 0.02, 0.0169, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.0332, 0.1101, 0.1571, 0.1443, 0.1272,
        0.1172, 0.1072, 0.1, 0.0972, 0.131, 0.2346, 0.2146, 0.1973, 0.1846, 0.1886, 0.2347, 0.2358, 0.2748, 0.2548,
        0.2555, 0.2923, 0.2649, 0.245, 0.225, 0.2274, 0.2726, 0.2451, 0.2446, 0.2851, 0.2652, 0.2452, 0.2253, 0.2053,
        0.1877, 0.1754, 0.1554, 0.156, 0.2055, 0.1855, 0.1678, 0.1578, 0.1478, 0.1356, 0.1178, 0.1079, 0.1, 0.0979,
        0.0879, 0.0779, 0.07, 0.0843, 0.138, 0.128, 0.118, 0.108, 0.0981, 0.0881, 0.08, 0.0781, 0.07, 0.0682, 0.06,
        0.0582, 0.05, 0.0482, 0.04, 0.04, 0.0383, 0.03, 0.03, 0.0283, 0.02, 0.033, 0.0984, 0.0884, 0.08, 0.1033,
      ],
      pifs: {
        rx: {
          '0': [
            177.1505, 146.0538, 65.197, 161.1729, 140.153, 133.3197, 95.6565, 254.4575, 622.2478, 613.8387, 154.9934,
            124.0258, 187.5361, 198.7337, 166.6895, 197.9211, 159.0272, 138.8176, 177.7427, 138.8519, 138.6663,
            149.9577, 156.1524, 165.8935, 173.4432, 160.3388, 233.173, 260.8957, 139.7597, 169.8137, 113.6127, 421.4655,
            817.7339, 266.2525, 520.4689, 150.6032, 190.2794, 193.0448, 160.5704, 182.0646, 110.6279, 62.0256, 237.651,
            297.4287, 248.6124, 124.6001, 135.1613, 127.4922, 137.3023, 186.3178, 215.8744, 176.2602, 166.0728,
            177.0399, 122.5788, 225.3141, 622.6523, 548.8357, 122.3089, 195.4243, 276.8979, 193.8274, 190.4752,
            156.2348, 199.6902, 156.4138, 136.0526, 149.4206, 142.098, 165.8939, 112.3953, 125.9506, 178.4714, 262.318,
            207.2666, 200.2995, 174.3736, 205.5677, 18.7483, 97.1194, 370.3324, 917.407, 128.3314, 175.9807, 112.3198,
            111.9657, 145.1591, 140.079, 218.2649, 214.8196, 192.7014, 175.0843, 119.3893, 121.1903, 144.0656, 188.201,
            120.877, 157.461, 133.2787, 168.9598, 166.4183, 193.7425, 218.7006, 312.7589, 965.4944, 155.9674, 342.8991,
            296.6323, 591.9749, 166.365, 112.7707, 167.502, 160.8092, 223.3223, 211.1992, 177.7079, 20.2051, 127.1545,
          ],
          '1': [
            189.4876, 116.8431, 63.3135, 181.0414, 553.2811, 838.5921, 192.277, 199.4739, 177.2014, 184.4713, 513.2862,
            757.6664, 177.6102, 180.5172, 191.3914, 263.0015, 591.4913, 791.7061, 298.3245, 419.0697, 231.2719,
            223.6201, 489.2033, 780.8646, 183.6428, 204.0968, 230.1329, 239.0858, 655.997, 980.0488, 180.0527, 192.8379,
            282.7487, 656.5881, 784.7719, 183.571, 186.4121, 190.1587, 208.6954, 611.2658, 1019.4175, 55.8925, 187.4972,
            179.731, 192.0186, 188.1511, 479.8468, 952.6181, 216.3036, 233.8062, 240.7673, 272.0145, 512.7843, 687.7659,
            224.8852, 217.9776, 206.3708, 8436.2803, 26685.4648, 12811.7305, 10669.3057, 6786.4961, 7084.0381,
            4580.3521, 545.4028, 864.8164, 202.1622, 505.0804, 1147.189, 452.3743, 1086.2987, 894.4191, 1005.7607,
            2717.6548, 245.2338, 451.8658, 987.2057, 163.0364, 1074.0902, 3796.7485, 784.3134, 1258.4941, 430.8885,
            887.2435, 218.9164, 206.8704, 191.4602, 330.3448, 809.7494, 883.0421, 194.0328, 208.9014, 484.3492,
            1186.8184, 440.232, 987.4225, 220.3967, 218.6031, 212.9356, 246.0948, 520.4993, 1043.0072, 194.5119,
            198.7182, 419.5035, 1362.4612, 680.6985, 555.4032, 201.996, 206.6911, 220.3556, 352.4922, 1076.2238,
            200.6009, 189.8869, 146.8022, 27.4213, 365.4701,
          ],
        },
        tx: {
          '0': [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
          '1': [
            0, 0, 0, 0, 558.8698, 1005.7303, 6.3661, 11.6339, 0, 0, 541.6819, 1022.9182, 0, 0, 0, 0, 643.691, 1278.509,
            0, 0, 0, 0, 516.5421, 1075.058, 0, 0, 0, 0, 766.8823, 1675.5177, 0, 0, 0, 474.9793, 1089.6207, 0, 0, 0, 0,
            473.7006, 1144.8994, 0, 0, 0, 0, 0, 619.1703, 1591.2296, 0, 0, 0, 0, 454.2817, 1231.9594, 13.159, 0, 0,
            54619.0508, 191640.25, 150561.125, 138005.5469, 74966.125, 85759.9531, 56211.7656, 390.0007, 1174.5992, 0,
            400.7921, 1237.8263, 376.2454, 1520.9313, 1188.0049, 3194.2131, 10315.5859, 20.2006, 355.7656, 1181.8344, 0,
            4256.373, 14544.3926, 454.6388, 1551.9141, 347.2362, 1200.6456, 0, 0, 0, 0, 326.7213, 1237.8787, 3.6863,
            14.3137, 335.0124, 1330.0206, 376.2695, 1487.8975, 0, 0, 0, 0, 368.2305, 1615.5696, 0, 0, 347.7944,
            1874.757, 1260.453, 21.7956, 0, 0, 0, 258.9554, 1305.6447, 0, 0, 0, 0, 266.3527,
          ],
        },
      },
      ioThroughput: {
        r: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
        w: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
      },
      iops: {
        r: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
        w: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
      },
      iowait: {
        a152347d: [
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0, 0, 0,
        ],
      },
      latency: {
        r: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
        w: {
          a152347d: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
          ],
        },
      },
    },
  },
}

export const poolDashboard = {
  hosts: {
    status: {
      running: 3,
      disabled: 0,
      halted: 0,
      total: 3,
    },
    topFiveUsage: {
      ram: [
        {
          name_label: 'XCP XO 8.3.0 master',
          id: 'b61a5c92-700e-4966-a13b-00633f03eea8',
          size: 34359738368,
          usage: 6254059520,
          percent: 18.201708793640137,
        },
        {
          name_label: 'XCP XO 8.3.0 slave',
          id: '84e555d8-267a-4720-aa5f-fd19035aadae',
          size: 34359738368,
          usage: 3544117248,
          percent: 10.314738750457764,
        },
        {
          name_label: 'XCP XO 8.3.0 slave 2',
          id: '669df518-4e5d-4d84-b93a-9be2cdcdfca1',
          size: 34359738368,
          usage: 3544117248,
          percent: 10.314738750457764,
        },
      ],
      cpu: [
        {
          percent: 6.471593483001921,
          id: 'b61a5c92-700e-4966-a13b-00633f03eea8',
          name_label: 'XCP XO 8.3.0 master',
        },
        {
          percent: 2.340522127838084,
          id: '84e555d8-267a-4720-aa5f-fd19035aadae',
          name_label: 'XCP XO 8.3.0 slave',
        },
        {
          percent: 1.5935676943627188,
          id: '669df518-4e5d-4d84-b93a-9be2cdcdfca1',
          name_label: 'XCP XO 8.3.0 slave 2',
        },
      ],
    },
    missingPatches: {
      hasAuthorization: true,
      missingPatches: [
        {
          url: 'http://www.xen.org',
          version: '25.6.0',
          name: 'xenopsd-xc',
          license: 'LGPL-2.1-or-later WITH OCaml-LGPL-linking-exception',
          changelog: {
            date: 1750852800,
            description: '- Fix remote syslog configuration being broken on updates',
            author: 'Andrii Sultanov <andriy.sultanov@vates.tech> - 25.6.0-1.9',
          },
          release: '1.9.xcpng8.3',
          size: 5421696,
          description: 'Xenopsd using xc',
        },
        {
          url: 'http://www.xen.org',
          version: '25.6.0',
          name: 'forkexecd',
          license: 'LGPL-2.1-or-later WITH OCaml-LGPL-linking-exception',
          changelog: {
            date: 1750852800,
            description: '- Fix remote syslog configuration being broken on updates',
            author: 'Andrii Sultanov <andriy.sultanov@vates.tech> - 25.6.0-1.9',
          },
          release: '1.9.xcpng8.3',
          size: 2498124,
          description: 'A subprocess management service',
        },
      ],
    },
  },
  vms: {
    status: {
      running: 2,
      halted: 38,
      paused: 0,
      total: 40,
      suspended: 0,
    },
    topFiveUsage: {
      ram: [
        {
          id: 'db822c15-6f7d-8920-10bd-68d40fb12ac6',
          name_label: 'MRA alpine',
          memory: 536858624,
          memoryFree: 423256064,
          percent: 21.160610060349892,
        },
        {
          id: 'fe10b378-db7b-d2a4-eef6-0f1cde75d409',
          name_label: 'pbt_test',
          memory: 2147471360,
          memoryFree: 1813676032,
          percent: 15.54364515482991,
        },
      ],
      cpu: [
        {
          id: 'db822c15-6f7d-8920-10bd-68d40fb12ac6',
          name_label: 'MRA alpine',
          percent: 1.04830558411777,
        },
        {
          id: 'fe10b378-db7b-d2a4-eef6-0f1cde75d409',
          name_label: 'pbt_test',
          percent: 0.3743608540389682,
        },
      ],
    },
  },
  srs: {
    topFiveUsage: [
      {
        name_label: 'Local storage',
        id: '4cb0d74e-a7c1-0b7d-46e3-09382c012abb',
        percent: 45.51916716586373,
        physical_usage: 33539653632,
        size: 73682485248,
      },
      {
        name_label: 'Local storage',
        id: 'c4284e12-37c9-7967-b9e8-83ef229c3e03',
        percent: 23.527768920458005,
        physical_usage: 17335844864,
        size: 73682485248,
      },
      {
        name_label: 'XOSTOR NVME',
        id: 'c787b75c-3e0d-70fa-d0c3-cbfd382d7e33',
        percent: 18.56945625131877,
        physical_usage: 95048891392,
        size: 511856082944,
      },
      {
        name_label: 'Local storage',
        id: '8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
        percent: 16.016159531372924,
        physical_usage: 11801104384,
        size: 73682485248,
      },
    ],
  },
  alarms: [
    {
      name: 'ALARM',
      time: 1749572297,
      id: '71ef8836-56e4-97ca-02d1-e118ee1aad98',
      type: 'message',
      uuid: '71ef8836-56e4-97ca-02d1-e118ee1aad98',
      $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
      $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
      _xapiRef: 'OpaqueRef:fed2a9e5-6c72-dada-6f27-7475583ff3e7',
      body: {
        value: '1.054742',
        name: 'mem_usage',
      },
      object: {
        type: 'VM-controller',
        uuid: '9b4775bd-9493-490a-9afa-f786a44caa4f',
        href: '/rest/v0/vm-controllers/9b4775bd-9493-490a-9afa-f786a44caa4f',
      },
    },
    {
      name: 'ALARM',
      time: 1748688413,
      id: 'ef9008da-e244-9875-4b83-12de733c8aa9',
      type: 'message',
      uuid: 'ef9008da-e244-9875-4b83-12de733c8aa9',
      $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
      $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
      _xapiRef: 'OpaqueRef:d03c24dc-037d-ac8b-80ea-c5a1106cd678',
      body: {
        value: '0.962104',
        name: 'mem_usage',
      },
      object: {
        type: 'VM-controller',
        uuid: '9b4775bd-9493-490a-9afa-f786a44caa4f',
        href: '/rest/v0/vm-controllers/9b4775bd-9493-490a-9afa-f786a44caa4f',
      },
    },
  ],
  cpuProvisioning: {
    total: 48,
    assigned: 4,
    percent: 8.333333333333334,
  },
}

export const poolMissingPatches = [
  {
    url: 'http://www.samba.org/',
    version: '4.10.16',
    name: 'libsmbclient',
    license: 'GPLv3+ and LGPLv3+',
    changelog: {
      date: 1690286400,
      description: '- resolves: #2222250 - Fix netlogon capabilities level 2',
      author: 'Andreas Schneider <asn@redhat.com> - 4.10.16-25',
    },
    release: '25.el7_9',
    size: 149400,
    description: 'The SMB client library',
  },
  {
    url: 'http://www.openssh.com/portable.html',
    version: '7.4p1',
    name: 'openssh',
    license: 'BSD',
    changelog: {
      date: 1742212800,
      description: '- Fix CVE-2025-26465 - Fix cases where error codes were not correctly set',
      author: 'Lucas Ravagnier <lucas.ravagnier@vates.tech> - 7.4p1-23.3.2 + 0.10.3-2.23.3.2',
    },
    release: '23.3.2.xcpng8.2',
    size: 429044,
    description: 'An open source implementation of SSH protocol versions 1 and 2',
  },
]
