/* eslint-env jest */

import { compileGlobPattern } from './utils'

describe('compileGlobPattern()', () => {
  it('works', () => {
    const re = compileGlobPattern('foo, ba*, -bar')
    expect(re.test('foo')).toBe(true)
    expect(re.test('bar')).toBe(false)
    expect(re.test('baz')).toBe(true)
    expect(re.test('qux')).toBe(false)
  })
})
