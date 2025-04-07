export const alarmIds = [
  '/rest/v0/alarms/0c98c71c-2f9c-d5c2-b9b6-2c8371730eab',
  '/rest/v0/alarms/6a4cc401-6cba-0d41-3b02-b848c5017343',
]

export const partialAlarms = [
  {
    body: {
      value: '0.0',
      name: 'physical_utilisation',
    },
    id: '0c98c71c-2f9c-d5c2-b9b6-2c8371730eab',
    object: {
      type: 'unknown',
      uuid: '3f607494-26f1-b328-b626-d81cf007de37',
    },
    href: '/rest/v0/alarms/0c98c71c-2f9c-d5c2-b9b6-2c8371730eab',
  },
  {
    body: {
      value: '0.2',
      name: 'physical_utilisation',
    },
    id: '6a4cc401-6cba-0d41-3b02-b848c5017343',
    object: {
      type: 'SR',
      uuid: '8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
      href: '/rest/v0/srs/8aa2fb4a-143e-c2bc-05d4-c68bbb101d41',
    },
    href: '/rest/v0/alarms/6a4cc401-6cba-0d41-3b02-b848c5017343',
  },
]

export const alarm = {
  name: 'ALARM',
  time: 1724862780,
  type: 'message',
  uuid: '0c98c71c-2f9c-d5c2-b9b6-2c8371730eab',
  $pool: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  $poolId: 'b7569d99-30f8-178a-7d94-801de3e29b5b',
  _xapiRef: 'OpaqueRef:87ccf385-4197-11aa-3ca0-32213c4cb56d',
  id: '0c98c71c-2f9c-d5c2-b9b6-2c8371730eab',
  body: {
    value: '0.0',
    name: 'physical_utilisation',
  },
  object: {
    type: 'unknown',
    uuid: '3f607494-26f1-b328-b626-d81cf007de37',
  },
}
