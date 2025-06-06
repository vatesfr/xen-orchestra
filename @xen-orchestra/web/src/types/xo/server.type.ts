import type { XoPool } from '@/types/xo/pool.type.ts'
import type { Branded } from '@core/types/utility.type.ts'

export type XoServer = {
  allowUnauthorized: boolean
  enabled: boolean
  error?: Record<string, unknown>
  host: string
  httpProxy?: string
  id: Branded<'server'>
  label?: string
  poolId?: XoPool['id']
  poolNameDescription?: string
  poolNameLabel?: string
  readOnly: boolean
  status: 'connected' | 'disconnected' | 'connecting'
  username: string
}
