import type { RecordId } from '@/types/xo-object.type'

export enum SERVER_STATUS {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
}

type BaseServer = {
  allowUnauthorized: boolean
  enabled: boolean
  host: string
  id: RecordId<'server'>
  label: string | undefined
  readOnly: boolean
  type: 'server'
  username: string
}

type ConnectedServer = BaseServer & {
  status: SERVER_STATUS.CONNECTED
  poolId: RecordId<'pool'>
}

type ConnectingServer = BaseServer & {
  status: SERVER_STATUS.CONNECTING
}

type DisconnectedServer = BaseServer & {
  status: SERVER_STATUS.DISCONNECTED
  error?: any
}

export type Server = ConnectedServer | ConnectingServer | DisconnectedServer
