import type { XoPool } from './pool.type'

export type XoServer = {
  label: string
  host: string
  username: string
  readOnly: boolean
  allowUnauthorized: boolean
  poolId: XoPool['id']
  httpProxy?: string
  poolNameLabel?: string
  status: 'connected' | 'disconnected' | 'connecting'
}
