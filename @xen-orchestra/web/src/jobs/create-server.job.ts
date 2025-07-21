import type { XoServer } from '@/types/xo/server.type.ts'
import { useFetch } from '@vueuse/core'
import { type ShallowRef, toValue } from 'vue'

export class ApiError extends Error {
  status: number | null
  cause?: string

  constructor(message: string, options: { cause?: string; status?: ShallowRef<number | null> | number | null } = {}) {
    super(message)
    this.status = toValue(options.status) ?? null
    this.cause = options.cause
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

export default async function createAndConnectServer(payload: NewServer) {
  const serverId = await createServer(payload)

  try {
    await connectServer(serverId)
  } catch (error: any) {
    // If error, we remove the server to avoid any duplication.
    await removeServer(serverId)

    throw error
  }

  // Return the server ID after successful connection
  // To redirect to the server page
  return serverId
}

// First, create the server
export async function createServer(payload: NewServer): Promise<XoServer['id']> {
  const {
    data,
    statusCode: status,
    error,
  } = await useFetch(
    `/rest/v0/servers?sync=true`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    },
    {
      updateDataOnError: true,
    }
  ).json()

  if (error.value) {
    throw new ApiError(error.value, {
      cause: data.value,
      status: status.value,
    })
  }

  return data.value.id
}

// Then, connect to the server using the newly created server ID
export async function connectServer(serverId: XoServer['id']) {
  const {
    data,
    statusCode: status,
    error,
  } = await useFetch(
    `/rest/v0/servers/${serverId}/actions/connect?sync=true`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      updateDataOnError: true,
    }
  )

  if (error.value) {
    throw new ApiError(error.value, {
      cause: String(data.value),
      status: status.value,
    })
  }
}

// remove server if you have an error on connection
export async function removeServer(serverId: XoServer['id']) {
  const { statusCode: status, error } = await useFetch(`/rest/v0/servers/${serverId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })

  if (error.value) {
    throw new ApiError(error.value, { status: status.value })
  }
}

export type NewServer = {
  host: string
  httpProxy: string
  username: string
  password: string
  readOnly?: boolean
  allowUnauthorized?: boolean
  label?: string
}
