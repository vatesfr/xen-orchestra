import { getUnprocessableEntityData } from '@/shared/utils/api-error.util.ts'
import { hasObjectProperty } from '@core/utils/object.util.ts'
import { V2V_ERROR_CODE } from '@vates/types'

export function isV2vInvalidCredentialsError(error: unknown): boolean {
  const errorData = getUnprocessableEntityData(error)

  return hasObjectProperty(errorData, 'code') && errorData.code === V2V_ERROR_CODE.INVALID_CREDENTIALS
}
