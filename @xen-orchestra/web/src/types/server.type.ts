import type { RecordId } from '@/types/xo-object.type'

export type Server = {
  id: RecordId<'server'>
  type: 'server'
  host: string
  label: string
  username: string
  allowUnauthorized: boolean
  enabled: boolean
  readonly: boolean
  status: string
  poolId: string
  href: string
}
