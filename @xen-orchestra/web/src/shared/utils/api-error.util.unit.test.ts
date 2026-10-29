import { getUnprocessableEntityData } from '@/shared/utils/api-error.util.ts'
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
