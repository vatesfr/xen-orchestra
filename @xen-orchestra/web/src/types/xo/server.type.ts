import type { XoPool } from './pool.type'

export type XoServer = {
  label: string
  host: string
  httpProxy?: string
  username: string
  readOnly: boolean
  allowUnauthorized: boolean
  poolId: XoPool['id']
}
