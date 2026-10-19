import type { V2V_PLATFORM, XoV2vConnection } from '@vates/types'

export type V2vRememberedConnectionKey = `${string}:${number}:${string}`

export type V2vRememberedConnection = Omit<XoV2vConnection, 'password'> & {
  platform: V2V_PLATFORM
  password?: string
  product?: string
  version?: string
  sourceId?: string
  vmCount?: number
  lastUsedAt?: number
}

export type V2vRememberedConnectionDetails = Pick<
  V2vRememberedConnection,
  'product' | 'version' | 'sourceId' | 'vmCount' | 'lastUsedAt'
>

export type V2vRememberedConnectionsStorage = {
  version: 1
  xo5Imported: boolean
  connections: V2vRememberedConnection[]
}
