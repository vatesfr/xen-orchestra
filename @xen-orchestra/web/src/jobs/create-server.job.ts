import type { XoServer } from '@/types/xo/server.type.ts'
import type { XoTask } from '@/types/xo/task.type.ts'
import { useFetch } from '@vueuse/core'
import type { ShallowRef } from 'vue'

class ServerError extends Error {
  status: ShallowRef<number | null> | number

  constructor(message: string, { status }: { status: ShallowRef<number | null> | number }) {
    super(JSON.stringify(message, null, 2))
    this.status = status
  }
}

export default async function createAndConnectServer(payload: ConnectServerPayload) {
  const serverId = await createServer(payload)

  try {
    const taskUrl = await connectServer(serverId)
    await monitorTask(taskUrl)
  } catch (error) {
    // If an error , we remove the server to avoid any duplication.
    const err = error as any
    if (!(err.result && err.result.code === 'UND_ERR_CONNECT_TIMEOUT')) {
      await removeServer(serverId)
    }
    throw error
  }

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
  } = await useFetch(
    `/rest/v0/servers`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    {
      // return row response
      onFetchError: context => {
        return context
      },
      afterFetch(context) {
        return context
      },
    }
  ).json<{ id: XoServer['id'] }>()

  if (error.value) {
    throw new ServerError(error.value, { status: status.value ?? 0 })
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
  } = await useFetch(
    `/rest/v0/servers/${serverId}/actions/connect`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      // return row response
      onFetchError: context => {
        return context
      },
      afterFetch(context) {
        return context
      },
    }
  ).json()

  if (error.value) {
    throw new ServerError(error.value, { status: status.value ?? 0 })
  }

  return data.value
}

export async function monitorTask(url: string) {
  // FIXME loop dont work correctly.
  // loops while task is not finish with 12 limits (20 minutes)
  let loop = 0
  while (loop < 120) {
    const {
      data: dataResponse,
      statusCode: status,
      error,
    } = await useFetch(
      `${url}?wait=result`,
      {
        method: 'GET',
      },
      {
        // return row response
        onFetchError: context => {
          return context
        },
        afterFetch(context) {
          return context
        },
      }
    ).json<XoTask>()

    if (error.value) {
      throw new ServerError(error.value, { status: status.value ?? 0 })
    }

    const data: any = dataResponse.value
    // if task is not finish after 10seconds, loop
    if (data.result && data.result.code === 'UND_ERR_CONNECT_TIMEOUT') {
      loop++
      continue
    }

    if (data.status !== 'success') {
      if (data.result.code === 'SESSION_AUTHENTICATION_FAILED') {
        throw new ServerError(data.result, { status: 401 })
      } else if (data.result.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        throw new ServerError(data.result, { status: 495 })
      } else {
        throw new ServerError(data.result, { status: data.result.errno })
      }
    }

    return data
  }

  throw new ServerError('ConnectTimeoutError', { status: 408 })
}

// remove server if you have an error on connect
export async function removeServer(serverId: XoServer['id']) {
  const {
    data,
    statusCode: status,
    error,
  } = await useFetch(
    `/rest/v0/servers/${serverId}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      // return row response
      onFetchError: context => {
        return context
      },
      afterFetch(context) {
        return context
      },
    }
  ).json()

  if (error.value) {
    throw new ServerError(error.value, { status: status.value ?? 0 })
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
