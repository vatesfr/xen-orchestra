import { getApiErrorDetails, getApiErrorMessage } from '@/shared/error/api-error.util.ts'
import { ApiError } from '@/shared/error/api.error.ts'

describe('getApiErrorMessage', () => {
  it('returns the XO error of an API error', () => {
    const error = new ApiError('Unprocessable Entity', { status: 422, cause: { error: 'invalid parameters' } })

    expect(getApiErrorMessage(error)).toBe('invalid parameters')
  })

  it('falls back on the HTTP status text without XO error', () => {
    expect(getApiErrorMessage(new ApiError('Not Found', { status: 404 }))).toBe('Not Found')
  })

  it('falls back on the HTTP status text when the XO error is not a string', () => {
    const error = new ApiError('Internal Server Error', { status: 500, cause: { error: { code: 'EIO' } } })

    expect(getApiErrorMessage(error)).toBe('Internal Server Error')
  })

  it('returns the message of other errors', () => {
    expect(getApiErrorMessage(new Error('connect ECONNREFUSED'))).toBe('connect ECONNREFUSED')
  })

  it('stringifies a thrown value which is not an error', () => {
    expect(getApiErrorMessage('oops')).toBe('oops')
  })
})

describe('getApiErrorDetails', () => {
  it('returns the data of an API error', () => {
    const data = { errors: [{ instancePath: '/port', message: 'must be integer' }] }
    const error = new ApiError('Unprocessable Entity', { status: 422, cause: { error: 'invalid parameters', data } })

    expect(getApiErrorDetails(error)).toEqual(data)
  })

  it('returns undefined for an API error without data', () => {
    expect(getApiErrorDetails(new ApiError('Not Found', { status: 404, cause: { error: 'no such plugin' } }))).toBe(
      undefined
    )
  })

  it.each([null, 'invalid parameters'])('returns undefined when the data of an API error is %s', data => {
    const error = new ApiError('Unprocessable Entity', { status: 422, cause: { data } })

    expect(getApiErrorDetails(error)).toBeUndefined()
  })

  it('returns undefined for other errors', () => {
    expect(getApiErrorDetails(new Error('oops'))).toBeUndefined()
  })
})
