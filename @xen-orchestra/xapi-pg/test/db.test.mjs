import * as assert from 'node:assert'
import { suite, test } from 'node:test'
import { xapi2DbField, xapi2DbRefField, XapiDBClass, rows2Columns } from '../src/db.mjs'
import { UUID_TYPE, VARCHAR_255, XAPI_PRIMITIVE_TYPES_MAP, JSON_TYPE } from '../src/types.mjs'

function createClass(name, fields = {}) {
  return new XapiDBClass({ name, fields }, 'schema')
}

function createClassesWithUuid() {
  const source = createClass('clz', { uuid: { name: 'uuid', type: 'string' } })
  const target = createClass('cls', { uuid: { name: 'uuid', type: 'string' } })
  source.convertNonRefFieldsToDbModel()
  target.convertNonRefFieldsToDbModel()
  return { source, target }
}

suite('simple tests', function () {
  for (const [name, type, sequelizeType] of [
    ['string', 'string', XAPI_PRIMITIVE_TYPES_MAP.string],
    ['enum', 'enum lol', VARCHAR_255],
    ['datetime', 'datetime', XAPI_PRIMITIVE_TYPES_MAP.datetime],
    ['simple Set', 'string set', JSON_TYPE],
    ['non-simple Set', 'string set set', JSON_TYPE],
    ['simple Map', '(string -> int) map', JSON_TYPE],
  ]) {
    test(`xapi2DbField can transform a ${name} field`, function () {
      const actual = xapi2DbField('clz', 'field', type, 'desc')
      assert.partialDeepStrictEqual(actual, {
        name: 'field',
        type,
        isRef: false,
        isSeparateTable: false,
        throughTableName: null,
        sequelizeDef: { type: sequelizeType },
      })
    })
  }

  test('xapi2DbField can transform the uuid field', function () {
    const actual2 = xapi2DbField('clz', 'uuid', 'string', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'uuid',
      type: 'string',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: UUID_TYPE, primaryKey: true },
    })
  })

  test('xapi2DbField returns undefined and logs an error for an unsupported field type', function () {
    const actual = xapi2DbField('clz', 'field', 'unsupported', 'desc')
    assert.strictEqual(actual, undefined)
  })

  test('convertNonRefFieldsToDbModel handles unsupported field types by skipping them', function () {
    const clazz = {
      name: 'clz',
      description: 'desc',
      fields: {
        uuid: { name: 'uuid', type: 'string', description: 'uuid' },
        supported: { name: 'supported', type: 'string', description: 'supported' },
        unsupported: { name: 'unsupported', type: 'unsupported', description: 'unsupported' },
      },
    }
    const xdClazz = new XapiDBClass(clazz, 'schema')
    xdClazz.convertNonRefFieldsToDbModel()

    assert.ok(xdClazz.fields.find(f => f.name === 'uuid'))
    assert.ok(xdClazz.fields.find(f => f.name === 'supported'))
    assert.strictEqual(
      xdClazz.fields.find(f => f.name === 'unsupported'),
      undefined
    )

    assert.strictEqual(xdClazz.fields.length, 2)
    assert.strictEqual(xdClazz.nonRefFields.length, 2)
  })

  test('convertRefFieldsToDBModel adds converted reference fields', function () {
    const clazz = new XapiDBClass(
      { name: 'clz', fields: { field: { name: 'field', type: 'cls ref', description: 'desc' } } },
      'schema'
    )
    const target = new XapiDBClass({ name: 'cls', fields: {} }, 'schema')

    clazz.convertRefFieldsToDBModel({ cls: target })

    assert.strictEqual(clazz.fields.length, 1)
    assert.strictEqual(clazz.refFields.length, 1)
    assert.strictEqual(clazz.fields[0], clazz.refFields[0])
    assert.strictEqual(clazz.refFields[0].name, 'field')
  })

  test('convertRefFieldsToDBModel rejects a reference to an unknown class', function () {
    const clazz = new XapiDBClass(
      { name: 'clz', fields: { field: { name: 'field', type: 'missing ref', description: 'desc' } } },
      'schema'
    )

    assert.throws(() => clazz.convertRefFieldsToDBModel({}), {
      message: 'ref field clz.field (missing ref) points to unknown class missing',
    })
    assert.deepStrictEqual(clazz.fields, [])
    assert.deepStrictEqual(clazz.refFields, [])
  })

  test('xapi2DbRefField can transform a direct ref field', function () {
    const { source: xdClazz, target: xdCls } = createClassesWithUuid()
    const actual2 = xapi2DbRefField(xdClazz, 'field', 'cls ref', 'desc', { cls: xdCls })
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'cls ref',
      isRef: true,
      isSeparateTable: false,
      sequelizeDef: {
        type: UUID_TYPE,
        references: { model: 'cls', key: 'uuid' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    })
  })

  test('xapi2DbRefField can transform a Set ref field', function () {
    const { source: xdClazz, target: xdCls } = createClassesWithUuid()

    const actual2 = xapi2DbRefField(xdClazz, 'field', 'cls ref set', 'desc', { cls: xdCls })
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'cls ref set',
      isRef: true,
      isSeparateTable: true,
      sequelizeDef: null,
    })
  })

  test('xapi2DbRefField can transform Map key ref field', function () {
    const { source: xdClazz, target: xdCls } = createClassesWithUuid()

    const actual2 = xapi2DbRefField(xdClazz, 'field', '(cls ref -> int) map', 'desc', { cls: xdCls })
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: '(cls ref -> int) map',
      isRef: true,
      isSeparateTable: true, //   tableName: 'clz_field',
      sequelizeDef: null,
    })
  })

  test('xapi2DbRefField rejects Map key and value ref field', function () {
    const clazz = createClass('clz')
    assert.throws(() => xapi2DbRefField(clazz, 'field', '(keyCls ref -> valueCls ref) map', 'desc', {}), {
      message: 'isStorableRef was true but no supported set or map type found for (keyCls ref -> valueCls ref) map',
    })
  })

  test('reference map db2Xapi handles nullish values and filters unresolved keys', function () {
    const clazz = createClass('clz')
    const field = xapi2DbRefField(clazz, 'field', '(cls ref -> string) map', 'desc', {})
    const refConverter = ref => (ref === 'missing' ? null : `converted:${ref}`)

    assert.deepStrictEqual(field.db2Xapi(null, refConverter), {})
    assert.deepStrictEqual(field.db2Xapi(undefined, refConverter), {})
    assert.deepStrictEqual(field.db2Xapi({}, refConverter), {})
    assert.deepStrictEqual(field.db2Xapi({ valid: 'value', missing: 'ignored' }, refConverter), {
      'converted:valid': 'value',
    })
  })

  test('reference map db2Xapi converts reference values', function () {
    const clazz = createClass('clz')
    const field = xapi2DbRefField(clazz, 'field', '(string -> cls ref) map', 'desc', {})

    assert.deepStrictEqual(
      field.db2Xapi({ key: 'ref', '': 'ignored' }, ref => `converted:${ref}`),
      {
        key: 'converted:ref',
      }
    )
  })

  test('xapi2DbRefField can transform Map value ref field', function () {
    const { source: xdClazz, target: xdCls } = createClassesWithUuid()

    const actual2 = xapi2DbRefField(xdClazz, 'field', '(int -> cls ref) map', 'desc', { cls: xdCls })
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: '(int -> cls ref) map',
      isRef: true,
      isSeparateTable: true, // throughModel: {name:'clz_field'},
      sequelizeDef: null,
    })
  })

  test('rows2Columns transforms rows to columns', function () {
    const records = [
      { f1: 'v1', f2: 10 },
      { f1: 'v2', f2: 11 },
    ]
    const expected = { f1: ['v1', 'v2'], f2: [10, 11] }
    const actual = rows2Columns(records)
    assert.deepStrictEqual(actual, expected)
  })

  test('rows2Columns supports projection via columnList', function () {
    const records = [
      { f1: 'v1', f2: 10 },
      { f1: 'v2', f2: 11 },
    ]
    const expected = { f1: ['v1', 'v2'] }
    const actual = rows2Columns(records, ['f1'])
    assert.deepStrictEqual(actual, expected)
  })

  test('rows2Columns uses defaultValuesRecord for missing values', function () {
    const records = [{ f1: 'v1' }, { f2: 11 }]
    const columnList = ['f1', 'f2']
    const defaultValuesRecord = { f1: 'defF1', f2: 'defF2' }
    const expected = { f1: ['v1', 'defF1'], f2: ['defF2', 11] }
    const actual = rows2Columns(records, columnList, defaultValuesRecord)
    assert.deepStrictEqual(actual, expected)
  })

  test('rows2Columns handles missing values with undefined if no default provided', function () {
    const records = [{ f1: 'v1' }, { f2: 11 }]
    const expected = { f1: ['v1', undefined], f2: [undefined, 11] }
    const actual = rows2Columns(records)
    assert.deepStrictEqual(actual, expected)
  })
})
