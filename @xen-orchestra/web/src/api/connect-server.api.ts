import { fetchDelete, fetchPost } from '@/utils/fetch.util.ts'
import type { XoServer } from '@vates/types'

export default async function createAndConnectServer(payload: NewServerPayload) {
  const { id } = await createServer(payload)

  try {
    await connectServer(id)
  } catch (error) {
    // If error, we remove the server to avoid any duplication.
    await removeServer(id)

    throw error
  }

  // Return the server ID after successful connection
  // To redirect to the server page
  return id
}

// First, create the server
export function createServer(payload: NewServerPayload) {
  return fetchPost<{ id: XoServer['id'] }>('servers', payload)
}

// Then, connect to the server using the newly created server ID
export function connectServer(serverId: XoServer['id']) {
  return fetchPost<void>(`servers/${serverId}/actions/connect?sync=true`)
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
