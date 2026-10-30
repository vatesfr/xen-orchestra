import { ApiError } from '@/shared/error/api.error.ts'
import { getApiErrorMessage, getUnprocessableEntityData } from '@/shared/utils/api-error.util.ts'
import { createApiError } from '@/test/create-api-error.ts'

describe('getUnprocessableEntityData', () => {
  it('reads the data of a 422', () => {
    const error = createApiError(422, { error: 'invalid', data: { code: 'X' } })

    expect(getUnprocessableEntityData(error)).toEqual({ code: 'X' })
  })

  it.each([
    ['another status', createApiError(500, { data: { code: 'X' } })],
    ['a 422 without data', createApiError(422, { error: 'invalid' })],
    ['a 422 without cause', createApiError(422)],
    ['a non API error', new Error('network down')],
    ['no error', undefined],
  ])('reads no data from %s', (_, error) => {
    expect(getUnprocessableEntityData(error)).toBeUndefined()
  })
})

describe('getApiErrorMessage', () => {
  it('reads the error the server answered', () => {
    expect(getApiErrorMessage(createApiError(500, { error: 'host unreachable' }))).toBe('host unreachable')
  })

  it('falls back to the error message', () => {
    expect(getApiErrorMessage(createApiError(502))).toBe('Request failed')
    expect(getApiErrorMessage(new Error('network down'))).toBe('network down')
  })

  it.each(['', 42, { message: 'host unreachable' }])(
    'falls back to the error message when the server error is %o',
    error => {
      expect(getApiErrorMessage(createApiError(500, { error }))).toBe('Request failed')
    }
  )

  it.each([new ApiError('', { status: 500 }), new Error(''), 'string', undefined])(
    'has no message to show without any (%s)',
    error => {
      expect(getApiErrorMessage(error)).toBeUndefined()
    }
  )
})
