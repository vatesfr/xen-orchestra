import type { XoServer } from '@/types/xo/server.type.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import { useFetch } from '@vueuse/core'
import type { ShallowRef } from 'vue'

class ServerError extends Error {
  status: ShallowRef<number | null>

  constructor(message: string, { status }: { status: ShallowRef<number | null> }) {
    super(message)
    this.status = status
  }
}

export default async function createAndConnectServer(payload: ConnectServerPayload) {
  const serverId = await createServer(payload)

  const taskUrl = await connectServer(serverId)

  await monitorTask(taskUrl)

  // Return the server ID after successful connection
  // To redirect to the server page
  return serverId
}

// First, create the server
export async function createServer(payload: ConnectServerPayload) {
  const { data, statusCode, error } = await useFetch(`/rest/v0/servers`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).json<{ id: XoServer['id'] }>()

  if (error.value) {
    throw new ServerError(error.value, { status: statusCode })
  }

  if (!data.value) {
    throw new Error('Server creation failed: No server ID returned')
  }

  // return the server ID
  return data.value.id
}

// Then, connect to the server using the newly created server ID
export async function connectServer(serverId: XoServer['id']): Promise<string> {
  const { data, statusCode, error } = await useFetch(`/rest/v0/servers/${serverId}/actions/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).json()

  if (error.value) {
    throw new ServerError(error.value, { status: statusCode })
  }

  return data.value
}

// connectServer returns a task url (`/rest/v0/tasks/<taskId>`)
// add a function to monitor the task status and return the result
export async function monitorTask(url: string) {
  const { data, statusCode, error } = await useFetch(`${url}?wait=result`, {
    method: 'GET',
  }).json<XoTask>()

  if (error.value) {
    throw new ServerError(error.value, { status: statusCode })
  }

  if (!data.value || data.value.status !== 'success') {
    throw new Error(`Task failed: ${data.value?.properties.name || 'Unknown error'}`)
  }

  return data.value
}

export type ConnectServerPayload = {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly: boolean
  allowUnauthorized: boolean
}
