import type { XoPool } from '@/types/xo/pool.type.ts'
import type { Branded } from '@core/types/utility.type.ts'
import type { XoHost } from './host.type'

export type XoServer = {
  allowUnauthorized: boolean
  enabled: boolean
  error?: Record<string, unknown>
  host: string
  httpProxy?: string
  id: Branded<'server'>
  label?: string
  poolId?: XoPool['id']
  master?: XoHost['id']
  poolNameDescription?: string
  poolNameLabel?: string
  readOnly: boolean
  status: 'connected' | 'disconnected' | 'connecting'
  username: string
}
