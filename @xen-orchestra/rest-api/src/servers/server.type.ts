import { NonXapiObject } from '../xoApp.type.js'

export interface XoServer extends NonXapiObject {
  allowUnauthorized: boolean
  host: string
  label: string
  password: string
  username: string
  enabled: boolean
  readOnly: boolean
  status: 'connected' | 'disconnected'
  error?: any
  poolId: string /* XoPool['id'] */
}
