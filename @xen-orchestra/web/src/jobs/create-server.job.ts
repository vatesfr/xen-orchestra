import type { XoServer } from '@/types/xo/server.type.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import { useFetch } from '@vueuse/core'
import type { ShallowRef } from 'vue'

class ServerError extends Error {
  status: ShallowRef<number | null> | number

  constructor(message: string, { status }: { status: ShallowRef<number | null> | number }) {
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
  const {
    data,
    statusCode: status,
    error,
  } = await useFetch(`/rest/v0/servers`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  }).json<{ id: XoServer['id'] }>()

  if (error.value) {
    throw new ServerError(error.value, { status })
  }

  if (!data.value) {
    throw new Error('Server creation failed: No server ID returned')
  }

  return data.value.id
}

// Then, connect to the server using the newly created server ID
export async function connectServer(serverId: XoServer['id']): Promise<string> {
  const {
    data,
    statusCode: status,
    error,
  } = await useFetch(`/rest/v0/servers/${serverId}/actions/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }).json()

  if (error.value) {
    throw new ServerError(error.value, { status })
  }

  return data.value
}

export async function monitorTask(url: string) {
  // loops while task is not finish with 12 limits (2 minutes)
  let loop = 0
  while (loop < 12) {
    const {
      data: dataResponse,
      statusCode: status,
      error,
    } = await useFetch(`${url}?wait=result`, {
      method: 'GET',
    }).json<XoTask>()

    if (error.value) {
      throw new ServerError(error.value, { status })
    }

    const data: any = dataResponse.value
    // if task is not finish after 10seconds, loop
    if (data.code === 'UND_ERR_CONNECT_TIMEOUT') {
      loop++
      continue
    }

    if (data.status !== 'success') {
      if (data.result.code === 'SESSION_AUTHENTICATION_FAILED') {
        throw new ServerError(`Task failed: ${data.result.message || 'Unknown error'}`, { status: 401 })
      } else if (data.result.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        throw new ServerError(`Task failed: ${data.result.message || 'Unknown error'}`, { status: 495 })
      } else {
        throw new ServerError(`Task failed: ${data.result.code || 'Unknown error'}`, { status: data.result.errno })
      }
    }

    return data.value
  }

  throw new ServerError(`Fetch is aborted`, { status: 408 })
}

// remove server if you have an error on connect
// export async function removeServer(serverId: XoServer['id']) {}

export type ConnectServerPayload = {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly: boolean
  allowUnauthorized: boolean
}
