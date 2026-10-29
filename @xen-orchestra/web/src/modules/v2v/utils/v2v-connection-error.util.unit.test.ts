import {
  getV2vConnectionErrorMessage,
  isV2vInvalidCredentialsError,
} from '@/modules/v2v/utils/v2v-connection-error.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
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

describe('getV2vConnectionErrorMessage', () => {
  it('reads the error the server answered', () => {
    expect(getV2vConnectionErrorMessage(createApiError(500, { error: 'host unreachable' }))).toBe('host unreachable')
  })

  it('falls back to the error message', () => {
    expect(getV2vConnectionErrorMessage(createApiError(502))).toBe('Request failed')
    expect(getV2vConnectionErrorMessage(new Error('network down'))).toBe('network down')
  })

  it.each([new ApiError('', { status: 500 }), new Error(''), 'string', undefined])(
    'has no message to show without any (%s)',
    error => {
      expect(getV2vConnectionErrorMessage(error)).toBeUndefined()
    }
  )
})
