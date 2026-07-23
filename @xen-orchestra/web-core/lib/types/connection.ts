export const CONNECTION_ACTION = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
} as const

export type ConnectionAction = (typeof CONNECTION_ACTION)[keyof typeof CONNECTION_ACTION]

export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  PARTIALLY_CONNECTED: 'partially-connected',
  DISCONNECTED: 'disconnected',
  PHYSICALLY_DISCONNECTED: 'physically-disconnected',
  DISCONNECTED_FROM_PHYSICAL_DEVICE: 'disconnected-from-physical-device',
} as const
