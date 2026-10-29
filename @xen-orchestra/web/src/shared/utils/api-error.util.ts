import { ApiError } from '@/shared/error/api.error.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { hasObjectProperty } from '@core/utils/object.util.ts'

// The `data` of the XO error the REST API answered a request it could not process with, untyped
export function getUnprocessableEntityData(error: unknown): unknown {
  const isUnprocessableApiError = error instanceof ApiError && error.status === HttpCodes.UnprocessableEntity

  return isUnprocessableApiError && hasObjectProperty(error.cause, 'data') ? error.cause.data : undefined
}
