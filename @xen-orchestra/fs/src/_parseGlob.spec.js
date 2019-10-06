/* eslint-env jest */

import { parseGlob } from './_parseGlob'

describe('parseGlob', () => {
  it.each([['foo/*/bar*baz/qux', ['foo', /^[^]*$/, /^bar[^]*baz$/, 'qux']]])(
    'parse %j correctly',
    (pattern, result) => {
      expect(parseGlob(pattern)).toEqual(result)
    }
  )
})
