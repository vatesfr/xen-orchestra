import {
  getV2vConnectionErrorMessage,
  isV2vInvalidCredentialsError,
} from '@/modules/v2v/utils/v2v-connection-error.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'
import { V2V_ERROR_CODE } from '@vates/types'

function createApiError(status: number, cause?: Record<string, unknown>) {
  return new ApiError('Request failed', { status, cause })
}

function createCodedApiError(status: number, code: string) {
  return createApiError(status, { error: 'failed', data: { code } })
}

describe('isV2vInvalidCredentialsError', () => {
  it('detects a 422 carrying the invalid credentials code', () => {
    expect(isV2vInvalidCredentialsError(createCodedApiError(422, V2V_ERROR_CODE.INVALID_CREDENTIALS))).toBe(true)
  })

  it('ignores a 422 with another code', () => {
    expect(isV2vInvalidCredentialsError(createCodedApiError(422, 'OTHER'))).toBe(false)
  })

  it('ignores another status carrying the invalid credentials code', () => {
    expect(isV2vInvalidCredentialsError(createCodedApiError(500, V2V_ERROR_CODE.INVALID_CREDENTIALS))).toBe(false)
  })

  it.each([undefined, { error: 'failed' }])('ignores a 422 without error code (%j)', cause => {
    expect(isV2vInvalidCredentialsError(createApiError(422, cause))).toBe(false)
  })

  it.each([new Error('network'), 'string', undefined])('ignores a non API error (%s)', error => {
    expect(isV2vInvalidCredentialsError(error)).toBe(false)
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
