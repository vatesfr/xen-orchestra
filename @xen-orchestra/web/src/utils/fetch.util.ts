import { ApiError } from '@/error/api.error.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'

export const BASE_URL = '/rest/v0'

const DEFAULT_OPTIONS: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'same-origin',
}

export async function fetchRequest<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const requestOptions: RequestInit = {
    ...DEFAULT_OPTIONS,
    ...options,
    headers: {
      ...DEFAULT_OPTIONS.headers,
      ...(options?.headers || {}),
    },
  }

  try {
    const response = await fetch(endpoint, requestOptions)

    let data: T | Record<string, unknown> | undefined
    if (response.status !== HttpCodes.NoContent) {
      data = await response.json()
    } else {
      data = undefined
    }

    if (!response.ok) {
      throw new ApiError(response.statusText, {
        cause: data as Record<string, unknown>,
        status: response.status,
      })
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    throw new Error((error as Error).message)
  }
}

export async function fetchPost<T>(endpoint: string, body?: unknown): Promise<T> {
  return fetchRequest<T>(endpoint, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function fetchDelete(endpoint: string): Promise<void> {
  return fetchRequest<void>(endpoint, {
    method: 'DELETE',
  })
}
