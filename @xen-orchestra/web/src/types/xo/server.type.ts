import type { XoPool } from '@/types/xo/pool.type'
import type { Branded } from '@core/types/utility.type'

export enum SERVER_STATUS {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
}

type BaseServer = {
  allowUnauthorized: boolean
  enabled: boolean
  host: string
  id: Branded<'server'>
  label: string | undefined
  readOnly: boolean
  type: 'server'
  username: string
}

type ConnectedServer = BaseServer & {
  status: SERVER_STATUS.CONNECTED
  poolId: XoPool['id']
}

type ConnectingServer = BaseServer & {
  status: SERVER_STATUS.CONNECTING
}

type DisconnectedServer = BaseServer & {
  status: SERVER_STATUS.DISCONNECTED
  error?: any
}

export type XoServer = ConnectedServer | ConnectingServer | DisconnectedServer
