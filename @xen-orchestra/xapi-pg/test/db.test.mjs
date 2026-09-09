import * as assert from 'node:assert'
import { suite, test } from 'node:test'
import { xapi2DbField, xapi2DbRefField, XapiDBClass, rows2Columns } from '../src/db.mjs'
import { UUID_TYPE, VARCHAR_255, XAPI_PRIMITIVE_TYPES_MAP, JSON_TYPE } from '../src/types.mjs'

suite('simple tests', function () {
  test('xapi2DbField can transform a string field', function () {
    const actual2 = xapi2DbField('clz', 'field', 'string', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'string',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: XAPI_PRIMITIVE_TYPES_MAP.string },
    })
  })

  test('xapi2DbField can transform an enum field', function () {
    const actual2 = xapi2DbField('clz', 'field', 'enum lol', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'enum lol',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: VARCHAR_255 },
    })
  })

  test('xapi2DbField can transform a datetime field', function () {
    const actual2 = xapi2DbField('clz', 'field', 'datetime', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'datetime',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: XAPI_PRIMITIVE_TYPES_MAP.datetime },
    })
  })

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

  test('xapi2DbField can transform a simple Set field', function () {
    const actual2 = xapi2DbField('clz', 'field', 'string set', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'string set',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: JSON_TYPE },
    })
  })

  test('xapi2DbField can transform a non-simple Set field', function () {
    const actual2 = xapi2DbField('clz', 'field', 'string set set', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: 'string set set',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: JSON_TYPE },
    })
  })

  test('xapi2DbField can transform a simple Map field', function () {
    const actual2 = xapi2DbField('clz', 'field', '(string -> int) map', 'desc')
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: '(string -> int) map',
      isRef: false,
      isSeparateTable: false,
      throughTableName: null,
      sequelizeDef: { type: JSON_TYPE },
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
    assert.ok(xdClazz.fields.find(f => f.name === 'uuid'))
    assert.ok(xdClazz.fields.find(f => f.name === 'supported'))
    assert.strictEqual(
      xdClazz.fields.find(f => f.name === 'unsupported'),
      undefined
    )
  })

  test('xapi2DbRefField can transform a direct ref field', function () {
    const clazz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const xdClazz = new XapiDBClass(clazz, 'schema')
    const xdCls = new XapiDBClass({ name: 'cls', fields: { uuid: { name: 'uuid', type: 'string' } } }, 'schema')
    xdClazz.convertNonRefFieldsToDbModel()
    xdCls.convertNonRefFieldsToDbModel()
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
    const clazz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const xdClazz = new XapiDBClass(clazz, 'schema')
    const xdCls = new XapiDBClass({ name: 'cls', fields: { uuid: { name: 'uuid', type: 'string' } } }, 'schema')
    xdClazz.convertNonRefFieldsToDbModel()
    xdCls.convertNonRefFieldsToDbModel()

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
    const clazz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const xdClazz = new XapiDBClass(clazz, 'schema')
    const xdCls = new XapiDBClass({ name: 'cls', fields: { uuid: { name: 'uuid', type: 'string' } } }, 'schema')
    // Postgres dialect is needed for toSql() to work on some types, but Sequelize.DataTypes often work without it.
    // However, the error says .toSql is not a function, which means the type object is not what we expect.
    xdClazz.convertNonRefFieldsToDbModel()
    xdCls.convertNonRefFieldsToDbModel()

    const actual2 = xapi2DbRefField(xdClazz, 'field', '(cls ref -> int) map', 'desc', { cls: xdCls })
    assert.partialDeepStrictEqual(actual2, {
      name: 'field',
      type: '(cls ref -> int) map',
      isRef: true,
      isSeparateTable: true, //   tableName: 'clz_field',
      sequelizeDef: null,
    })
  })

  test('xapi2DbRefField can transform Map value ref field', function () {
    const clazz = { name: 'clz', fields: { uuid: { name: 'uuid', type: 'string' } } }
    const xdClazz = new XapiDBClass(clazz, 'schema')
    const xdCls = new XapiDBClass({ name: 'cls', fields: { uuid: { name: 'uuid', type: 'string' } } }, 'schema')
    xdClazz.convertNonRefFieldsToDbModel()
    xdCls.convertNonRefFieldsToDbModel()

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
