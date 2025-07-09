import type { Branded, XapiXoRecord } from '@vates/types'

export type XoAlarm = {
  id: Branded<'ALARM'>
  time: number
  body: {
    value: string
    name: string
  }
  object: {
    type: XapiXoRecord['type'] | 'unknown'
    uuid: XapiXoRecord['uuid']
    href?: string
  }
}
