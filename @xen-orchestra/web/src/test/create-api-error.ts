import { ApiError } from '@/shared/error/api.error.ts'

// What `fetchRequest` throws when the REST API answers with this status and body
export function createApiError(status: number, cause?: Record<string, unknown>): ApiError {
  return new ApiError('Request failed', { status, cause })
}
