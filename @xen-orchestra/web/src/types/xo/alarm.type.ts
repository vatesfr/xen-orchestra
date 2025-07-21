import type { Branded, XoAlarm as VatesXoAlarm } from '@vates/types'

export type XoAlarm = Pick<VatesXoAlarm, 'time' | 'body' | 'object'> & {
  id: Branded<'ALARM'>
}
