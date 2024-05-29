import type { RecordId } from '@/types/xo-object.type'

export type Pool = {
  id: RecordId<'pool'>
  type: 'pool'
  $pool: RecordId<'pool'>
  master: RecordId<'host'>
  name_description: string
  name_label: string
  _xapiRef: string
}
