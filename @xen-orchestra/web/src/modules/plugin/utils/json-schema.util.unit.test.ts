import {
  getFieldType,
  getPropertyGroups,
  getSchemaDefaults,
  getSchemaType,
  getXoObjectReference,
  getXoObjectType,
  isMissingValue,
  isObjectSchemaWithProperties,
  isRequiredProperty,
  isSecretProperty,
  isSectionSchema,
  type JsonSchema,
} from '@/modules/plugin/utils/json-schema.util.ts'
import { OBFUSCATED_VALUE } from '@/shared/constants.ts'

describe('getSchemaType', () => {
  it('returns the type of the schema', () => {
    expect(getSchemaType({ type: 'boolean' })).toBe('boolean')
  })

  it('returns undefined without schema or type', () => {
    expect(getSchemaType(undefined)).toBeUndefined()
    expect(getSchemaType({})).toBeUndefined()
  })

  it('picks integer over number in a type list', () => {
    expect(getSchemaType({ type: ['number', 'integer'] })).toBe('integer')
  })

  it('picks number over string in a type list', () => {
    expect(getSchemaType({ type: ['string', 'number'] })).toBe('number')
  })

  it('falls back on string for any other type list', () => {
    expect(getSchemaType({ type: ['null', 'boolean'] })).toBe('string')
  })
})

describe('getXoObjectType', () => {
  it('reads `$type` and `xo:type` case insensitively', () => {
    expect(getXoObjectType({ type: 'string', $type: 'Host' })).toBe('host')
    expect(getXoObjectType({ type: 'string', 'xo:type': 'SR' })).toBe('sr')
  })

  it('prefers `xo:type` over `$type`', () => {
    expect(getXoObjectType({ type: 'string', 'xo:type': 'pool', $type: 'VM' })).toBe('pool')
  })

  it('returns undefined for unsupported XO types', () => {
    expect(getXoObjectType({ type: 'string', $type: 'remote' })).toBeUndefined()
  })

  it('returns undefined without schema or XO type', () => {
    expect(getXoObjectType(undefined)).toBeUndefined()
    expect(getXoObjectType({ type: 'string' })).toBeUndefined()
  })
})

describe('getXoObjectReference', () => {
  it('references a single XO object from a string', () => {
    expect(getXoObjectReference({ type: 'string', $type: 'VM' })).toEqual({ objectType: 'vm', multiple: false })
  })

  it('references several XO objects from an array of strings', () => {
    expect(getXoObjectReference({ type: 'array', items: { type: 'string', $type: 'Tag' } })).toEqual({
      objectType: 'tag',
      multiple: true,
    })
  })

  it('returns undefined when no XO object is referenced', () => {
    expect(getXoObjectReference({ type: 'string' })).toBeUndefined()
    expect(getXoObjectReference({ type: 'array', items: { type: 'string' } })).toBeUndefined()
  })

  it('returns undefined when the type cannot hold an XO object ID', () => {
    expect(getXoObjectReference({ type: 'object', $type: 'VM' })).toBeUndefined()
  })
})

describe('getFieldType', () => {
  it('handles enums before the type', () => {
    expect(getFieldType({ type: 'string', enum: ['a', 'b'], $type: 'VM' })).toBe('enum')
  })

  it('handles XO objects and lists of XO objects before the type', () => {
    expect(getFieldType({ type: 'string', $type: 'VM' })).toBe('xo-object')
    expect(getFieldType({ type: 'array', items: { type: 'string', $type: 'Tag' } })).toBe('xo-object')
  })

  it.each(['array', 'boolean', 'integer', 'number', 'object', 'string'] as const)('handles the %s type', type => {
    expect(getFieldType({ type })).toBe(type)
  })

  it('handles a type list', () => {
    expect(getFieldType({ type: ['null', 'integer'] })).toBe('integer')
  })

  it('returns undefined for unsupported schemas', () => {
    expect(getFieldType({})).toBeUndefined()
    expect(getFieldType({ type: 'null' })).toBeUndefined()
  })
})

describe('isSectionSchema', () => {
  it.each([{ type: 'object' }, { type: 'array' }] as const)('is true for the $type type', schema => {
    expect(isSectionSchema(schema)).toBe(true)
  })

  it.each<JsonSchema>([
    { type: 'string' },
    { type: 'boolean' },
    { type: 'string', enum: ['a'] },
    { type: 'array', items: { type: 'string', $type: 'Tag' } },
    {},
  ])('is false for %j', schema => {
    expect(isSectionSchema(schema)).toBe(false)
  })
})

describe('isRequiredProperty', () => {
  it('detects the properties listed in required', () => {
    expect(isRequiredProperty({ type: 'object', required: ['foo'] }, 'foo')).toBe(true)
    expect(isRequiredProperty({ type: 'object', required: ['foo'] }, 'bar')).toBe(false)
  })

  it('considers every property optional without required', () => {
    expect(isRequiredProperty({ type: 'object' }, 'foo')).toBe(false)
  })
})

describe('isObjectSchemaWithProperties', () => {
  it('detects an object schema with properties', () => {
    expect(isObjectSchemaWithProperties({ type: 'object', properties: {} })).toBe(true)
  })

  it('rejects an object schema without properties', () => {
    expect(isObjectSchemaWithProperties({ type: 'object' })).toBe(false)
  })

  it('rejects non-object schemas', () => {
    expect(isObjectSchemaWithProperties({ type: 'string', properties: {} })).toBe(false)
    expect(isObjectSchemaWithProperties(undefined)).toBe(false)
  })
})

describe('getPropertyGroups', () => {
  it('describes each property as a field', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { host: { type: 'string', title: 'Host' }, port: { type: 'integer' } },
      required: ['host'],
    }

    expect(getPropertyGroups(schema, ['server'])).toEqual([
      {
        fields: [
          {
            key: 'host',
            schema: { type: 'string', title: 'Host' },
            label: 'Host',
            path: ['server', 'host'],
            required: true,
          },
        ],
        isBooleans: false,
      },
      {
        fields: [
          { key: 'port', schema: { type: 'integer' }, label: 'port', path: ['server', 'port'], required: false },
        ],
        isBooleans: false,
      },
    ])
  })

  it('groups the consecutive booleans only', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        tls: { type: 'boolean' },
        verbose: { type: 'boolean' },
        host: { type: 'string' },
        debug: { type: 'boolean' },
      },
    }

    const groups = getPropertyGroups(schema, [])

    expect(groups.map(group => ({ keys: group.fields.map(field => field.key), isBooleans: group.isBooleans }))).toEqual(
      [
        { keys: ['tls', 'verbose'], isBooleans: true },
        { keys: ['host'], isBooleans: false },
        { keys: ['debug'], isBooleans: true },
      ]
    )
  })

  it('does not group a boolean enum, which is displayed as a select', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { tls: { type: 'boolean' }, mode: { type: 'boolean', enum: [true, false] } },
    }

    expect(getPropertyGroups(schema, []).map(group => group.isBooleans)).toEqual([true, false])
  })

  it('has no group without properties', () => {
    expect(getPropertyGroups({ type: 'object' }, [])).toEqual([])
  })
})

describe('getSchemaDefaults', () => {
  it('returns undefined for non-object schemas', () => {
    expect(getSchemaDefaults({ type: 'string', default: 'foo' })).toBeUndefined()
    expect(getSchemaDefaults(undefined)).toBeUndefined()
  })

  it('returns undefined for an object schema without properties', () => {
    expect(getSchemaDefaults({ type: 'object', default: { foo: 'bar' } })).toBeUndefined()
  })

  it('returns undefined when there is no default', () => {
    expect(getSchemaDefaults({ type: 'object', properties: { foo: { type: 'string' } } })).toBeUndefined()
  })

  it('collects defaults, including the ones of required nested objects', () => {
    expect(
      getSchemaDefaults({
        type: 'object',
        required: ['nested', 'emptyNested'],
        properties: {
          foo: { type: 'string', default: 'bar' },
          noDefault: { type: 'string' },
          nested: {
            type: 'object',
            properties: {
              port: { type: 'integer', default: 25 },
            },
          },
          emptyNested: {
            type: 'object',
            properties: { baz: { type: 'string' } },
          },
        },
      })
    ).toEqual({ foo: 'bar', nested: { port: 25 } })
  })

  it('skips the defaults of optional nested objects', () => {
    expect(
      getSchemaDefaults({
        type: 'object',
        properties: {
          foo: { type: 'string', default: 'bar' },
          optionalNested: {
            type: 'object',
            required: ['uri'],
            properties: {
              facility: { type: 'string', default: 'user' },
              uri: { type: 'string' },
            },
          },
        },
      })
    ).toEqual({ foo: 'bar' })
  })

  it('prefers the default of a nested object over the defaults of its properties', () => {
    expect(
      getSchemaDefaults({
        type: 'object',
        properties: {
          nested: { type: 'object', default: { port: 389 }, properties: { port: { type: 'integer', default: 25 } } },
        },
      })
    ).toEqual({ nested: { port: 389 } })
  })
})

describe('isSecretProperty', () => {
  it.each(['password', 'smtpPassword', 'PASSWORD', 'token', 'passphrase', 'encryptionKey'])(
    'detects a property named %s, as xo-server obfuscates it',
    name => {
      expect(isSecretProperty(name, { type: 'string' })).toBe(true)
    }
  )

  it('detects a property with the password format', () => {
    expect(isSecretProperty('secret', { type: 'string', format: 'password' })).toBe(true)
    expect(isSecretProperty(undefined, { type: 'string', format: 'password' })).toBe(true)
  })

  it('detects a property obfuscated by the API, whatever its name', () => {
    expect(isSecretProperty('clientSecret', { type: 'string' }, OBFUSCATED_VALUE)).toBe(true)
  })

  it('does not consider other properties as secret', () => {
    expect(isSecretProperty('username', { type: 'string' }, 'admin')).toBe(false)
    expect(isSecretProperty('tokens', { type: 'string' })).toBe(false)
    expect(isSecretProperty(undefined, { type: 'string' })).toBe(false)
  })
})

describe('isMissingValue', () => {
  it.each([undefined, null, ''])('considers %j as missing', value => {
    expect(isMissingValue(value)).toBe(true)
  })

  it.each([0, false, [], 'value'])('considers %j as set', value => {
    expect(isMissingValue(value)).toBe(false)
  })
})
