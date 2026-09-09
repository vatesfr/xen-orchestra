import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import {
  convertSimpleType,
  converterForSimpleType,
  datetimeDb2Xapi,
  datetimeXapi2Db,
  getRefFromType,
  ident,
  isNonRef,
  isSimpleType,
  isStorableRef,
  isSupportedMapType,
  isSupportedSetType,
  splitMapType,
  unwrapOption,
  unwrapRecord,
  unwrapSet,
} from '../src/types.mjs'
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

  test('isNonRef with record', function () {
    assert.strictEqual(isNonRef('my_record record'), false)
  })

  test('isStorableRef with record', function () {
    assert.strictEqual(isStorableRef('my_record record'), false)
  })

  test('unwrapOption', function () {
    assert.strictEqual(unwrapOption('string option'), 'string')
    assert.strictEqual(unwrapOption('string'), 'string')
  })

  test('unwrapRecord', function () {
    assert.strictEqual(unwrapRecord('my_record record'), 'my_record')
    assert.strictEqual(unwrapRecord('string'), null)
  })

  test('datetimeDb2Xapi', function () {
    assert.strictEqual(datetimeDb2Xapi(null), null)
    assert.strictEqual(datetimeDb2Xapi(undefined), null)

    const date = new Date('2020-09-03T20:50:13.000Z')
    assert.strictEqual(datetimeDb2Xapi(date), '20200903T20:50:13Z')
  })

  test('datetimeXapi2Db', function () {
    assert.strictEqual(datetimeXapi2Db('20200903T20:50:13Z'), '2020-09-03 20:50:13Z')
    assert.strictEqual(datetimeXapi2Db(''), null)
    assert.strictEqual(datetimeXapi2Db(null), null)
  })

  test('isSimpleType', function () {
    assert.strictEqual(isSimpleType('string option'), true)
    assert.strictEqual(isSimpleType('enum foo'), true)
    assert.strictEqual(isSimpleType('foo'), false)
  })

  test('convertSimpleType', function () {
    assert.strictEqual(convertSimpleType('string option'), 'TEXT')
    assert.strictEqual(convertSimpleType('foo'), 'VARCHAR(255)')
  })

  test('isSupportedSetType', function () {
    assert.strictEqual(isSupportedSetType('cls ref set'), true)
    assert.strictEqual(isSupportedSetType('string set'), false)
    assert.strictEqual(isSupportedSetType('string'), null)
  })

  test('converterForSimpleType', function () {
    assert.deepStrictEqual(converterForSimpleType('datetime'), [datetimeXapi2Db, datetimeDb2Xapi])
    assert.deepStrictEqual(converterForSimpleType('string'), [ident, ident])
    assert.throws(() => converterForSimpleType('foo'))
  })
})
