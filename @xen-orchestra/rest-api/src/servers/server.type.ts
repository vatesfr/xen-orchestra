export type XoServer =
  | {
      allowUnauthorized: boolean
      host: string
      label: string
      password: string
      username: string
      enabled: boolean
      readOnly: boolean
      id: string
      status: 'connected'
      poolId: string /* XoPool['id'] */
    }
  | {
      allowUnauthorized: boolean
      host: string
      label: string
      password: string
      username: string
      enabled: boolean
      readOnly: boolean
      id: string
      status: 'disconnected'
      error?: {
        [key: string]: unknown
        connectedServerId?: string
      }
    }
