import { ApiError } from '@/shared/error/api.error.ts'

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = error.cause?.error

    return typeof message === 'string' ? message : error.message
  }

  return error instanceof Error ? error.message : String(error)
}

export function getApiErrorDetails(error: unknown): object | undefined {
  if (error instanceof ApiError) {
    const data = error.cause?.data

    return typeof data === 'object' && data !== null ? data : undefined
  }

  return undefined
}
