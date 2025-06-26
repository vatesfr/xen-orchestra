import type { Branded } from '@core/types/utility.type'
import type { XoHost } from './host.type'
import type { XoPool } from './pool.type'

export type XoServer = {
  id: Branded<'server'>
  label: string
  host: string
  httpProxy?: string
  username: string
  readOnly: boolean
  allowUnauthorized: boolean
  poolId?: XoPool['id']
  master?: XoHost['id']
  poolNameLabel?: string
  status: 'connected' | 'disconnected' | 'connecting'
  error?: Record<string, unknown>
  poolNameDescription?: string
}
