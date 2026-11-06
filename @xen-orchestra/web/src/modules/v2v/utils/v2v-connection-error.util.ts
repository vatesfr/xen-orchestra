import { ApiError } from '@/shared/error/api.error.ts'
import { HttpCodes } from '@core/types/http-codes.type.ts'
import { hasObjectProperty } from '@core/utils/object.util.ts'
import { V2V_ERROR_CODE } from '@vates/types'

export function isV2vInvalidCredentialsError(error: unknown): boolean {
  const isUnprocessableApiError = error instanceof ApiError && error.status === HttpCodes.UnprocessableEntity

  if (!isUnprocessableApiError) {
    return false
  }

  const errorData = hasObjectProperty(error.cause, 'data') ? error.cause.data : undefined

  return hasObjectProperty(errorData, 'code') && errorData.code === V2V_ERROR_CODE.INVALID_CREDENTIALS
}

export function getV2vConnectionErrorMessage(error: unknown): string | undefined {
  const serverError =
    error instanceof ApiError && hasObjectProperty(error.cause, 'error') ? error.cause.error : undefined

  if (typeof serverError === 'string' && serverError !== '') {
    return serverError
  }

  return error instanceof Error && error.message !== '' ? error.message : undefined
}
