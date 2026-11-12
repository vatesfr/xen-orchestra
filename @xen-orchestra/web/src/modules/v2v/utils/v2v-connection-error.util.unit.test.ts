import { isV2vInvalidCredentialsError } from '@/modules/v2v/utils/v2v-connection-error.util.ts'
import { createApiError } from '@/test/create-api-error.ts'
import { V2V_ERROR_CODE } from '@vates/types'

function createCodedApiError(code: string) {
  return createApiError(422, { error: 'failed', data: { code } })
}

describe('isV2vInvalidCredentialsError', () => {
  it('detects a 422 carrying the invalid credentials code', () => {
    expect(isV2vInvalidCredentialsError(createCodedApiError(V2V_ERROR_CODE.INVALID_CREDENTIALS))).toBe(true)
  })

  it('ignores a 422 with another code', () => {
    expect(isV2vInvalidCredentialsError(createCodedApiError('OTHER'))).toBe(false)
  })

  it.each([undefined, { error: 'failed' }])('ignores a 422 without error code (%j)', cause => {
    expect(isV2vInvalidCredentialsError(createApiError(422, cause))).toBe(false)
  })
})
