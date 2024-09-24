import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import defined_ from '@xen-orchestra/defined/index.js'

// for each test, use the flat syntax and the array syntax
for (const [title, defined] of Object.entries({
  'defined(...values)': defined_,
  'defined([ ...values ])': (...args) => defined_(args),
})) {
  describe(title, () => {
    it('returns the first non undefined value', () => {
      assert.deepEqual(defined(undefined, 'foo', 42), 'foo')
    })

    it('returns undefined if only undefined values', () => {
      assert.equal(defined(undefined, undefined), undefined)
    })

    it('resolves functions with `get(fn)`', () => {
      const o = { foo: undefined, baz: 'baz' }
      assert.deepEqual(
        defined(
          () => o.foo.bar,
          () => o.baz
        ),
        'baz'
      )
    })
  })
}
