import {
  getFieldType,
  getSchemaDefaults,
  getSchemaType,
  getXoObjectReference,
  getXoObjectType,
  isSecretProperty,
} from '@/modules/plugin/json-schema-form/json-schema.util.ts'

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

  it('collects defaults, including nested ones', () => {
    expect(
      getSchemaDefaults({
        type: 'object',
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
  it('detects a property named password', () => {
    expect(isSecretProperty('password', { type: 'string' })).toBe(true)
  })

  it('detects a property with the password format', () => {
    expect(isSecretProperty('secret', { type: 'string', format: 'password' })).toBe(true)
    expect(isSecretProperty(undefined, { type: 'string', format: 'password' })).toBe(true)
  })

  it('does not consider other properties as secret', () => {
    expect(isSecretProperty('username', { type: 'string' })).toBe(false)
    expect(isSecretProperty(undefined, { type: 'string' })).toBe(false)
  })
})
