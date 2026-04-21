import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import { getRefFromType, isNonRef, isSupportedMapType, splitMapType, unwrapSet } from '../src/types.mjs'
suite('Types tests', function () {
  test('getRefFromType test', function () {
    const cases = [
      ['cls ref', 'cls'],
      ['cls ref set', 'cls'],
      ['(cls ref -> string) map', 'cls'],
      ['(string -> cls ref) map', 'cls'],
      ['(string -> string) map', null],
    ]
    for (const [input, expected] of cases) {
      const found = getRefFromType(input)
      assert.equal(found, expected, `getRefFromType('${input}') -> ${expected}`)
    }
  })

  test('isNonRef test', function () {
    const cases = [
      ['cls ref', false],
      ['cls ref set', false],
      ['(cls ref -> string) map', false],
      ['(string -> cls ref) map', false],
      ['string', true],
      ['int', true],
      ['float', true],
      ['bool', true],
      ['datetime', true],
      ['string set', true],
      ['(string -> string) map', true],
    ]
    for (const [input, expected] of cases) {
      const found = isNonRef(input)
      assert.equal(found, expected, `isNonRef('${input}') -> ${expected}`)
    }
  })

  test('splitMapType test', function () {
    assert.deepEqual(splitMapType('(int -> cls ref) map'), ['int', 'cls ref'])
    assert.deepEqual(splitMapType('int'), null)
  })

  test('isSupportedMapType test', function () {
    assert.ok(isSupportedMapType('(int -> cls ref) map'))
    assert.ok(isSupportedMapType('(cls ref -> int) map'))
    assert.ok(isSupportedMapType('(int -> int) map'))
    assert.ok(isSupportedMapType('(cls ref -> int set) map'))
    // maybe we could support this
    assert.ok(!isSupportedMapType('(cls ref -> cls ref) map'))
    // don't want to deal with set comparison
    assert.ok(!isSupportedMapType('(int set -> int) map'))
    assert.ok(!isSupportedMapType('(int set -> cls ref) map'))
  })

  test('unwrapSet test', function () {
    assert.deepEqual(unwrapSet('int set'), 'int')
    assert.deepEqual(unwrapSet('cls ref set'), 'cls ref')
    assert.deepEqual(unwrapSet('int'), null)
  })
})
