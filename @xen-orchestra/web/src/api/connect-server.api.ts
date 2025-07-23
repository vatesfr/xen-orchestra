import type { XoServer } from '@/types/xo/server.type.ts'
import { fetchDelete, fetchPost } from '@/utils/fetch.util.ts'

export default async function createAndConnectServer(payload: NewServer) {
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
export async function createServer(payload: NewServer) {
  return await fetchPost<XoServer>('/rest/v0/servers', payload)
}

// Then, connect to the server using the newly created server ID
export async function connectServer(serverId: XoServer['id']) {
  await fetchPost<void>(`/rest/v0/servers/${serverId}/actions/connect?sync=true`)
}

export async function removeServer(serverId: XoServer['id']) {
  await fetchDelete(`/rest/v0/servers/${serverId}`)
}

export type NewServer = {
  host: string
  httpProxy?: string
  username: string
  password: string
  readOnly?: boolean
  allowUnauthorized?: boolean
  label?: string
}
