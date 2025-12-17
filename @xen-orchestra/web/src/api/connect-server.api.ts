import { fetchDelete, fetchPost } from '@/utils/fetch.util.ts'
import type { XoServer, XoTask } from '@vates/types'

export function createServer(payload: NewServerPayload) {
  return fetchPost<{ id: XoServer['id'] }>('servers', payload)
}

export function connectServer(serverId: XoServer['id']) {
  return fetchPost<{ taskId: XoTask['id'] }>(`servers/${serverId}/actions/connect`)
}

export function removeServer(serverId: XoServer['id']) {
  return fetchDelete(`servers/${serverId}`)
}

export type NewServerPayload = {
  host: string
  username: string
  password: string
  httpProxy?: string
  readOnly?: boolean
  allowUnauthorized?: boolean
  label?: string
}
