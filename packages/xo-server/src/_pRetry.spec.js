/* eslint-env jest */

import pRetry from './_pRetry'

describe('pRetry()', () => {
  it('retries until the function succeeds', async () => {
    let i = 0
    expect(
      await pRetry(
        () => {
          if (++i < 3) {
            throw new Error()
          }
          return 'foo'
        },
        { delay: 0 }
      )
    ).toBe('foo')
    expect(i).toBe(3)
  })

  it('returns the last error', async () => {
    let tries = 5
    const e = new Error()
    await expect(
      pRetry(
        () => {
          throw --tries > 0 ? new Error() : e
        },
        { delay: 0, tries }
      )
    ).rejects.toBe(e)
  })
  ;[ReferenceError, TypeError].forEach(ErrorType => {
    it(`does not retry if a ${ErrorType.name} is thrown`, async () => {
      let i = 0
      await expect(
        pRetry(() => {
          ++i
          throw new ErrorType()
        })
      ).rejects.toBeInstanceOf(ErrorType)
      expect(i).toBe(1)
    })
  })
})
