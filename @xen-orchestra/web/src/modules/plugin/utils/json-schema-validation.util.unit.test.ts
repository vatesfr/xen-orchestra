import { getInvalidFields, isPathWithin, toPathKey } from '@/modules/plugin/utils/json-schema-validation.util.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { getItemLabel } from '@/test/json-schema-item-label.ts'

const OPTIONS = { getItemLabel }

const REQUIRED = { rule: 'required' }

const schema: JsonSchema = {
  type: 'object',
  properties: {
    uri: { type: 'string', title: 'URI' },
    checkCertificate: { type: 'boolean' },
    failoverUris: { type: 'array', items: { type: 'string' } },
    bind: {
      type: 'object',
      title: 'Credentials',
      properties: { dn: { type: 'string' }, password: { type: 'string' } },
      required: ['dn', 'password'],
    },
    mapping: {
      type: 'object',
      title: 'Mapping',
      properties: { attribute: { type: 'string' } },
      required: ['attribute'],
    },
    domains: {
      type: 'array',
      items: { type: 'object', title: 'Domain', properties: { uri: { type: 'string' } }, required: ['uri'] },
    },
  },
  required: ['uri', 'checkCertificate', 'mapping'],
}

function getInvalidPaths(value: unknown) {
  return getInvalidFields(schema, value, OPTIONS).map(field => field.path.join('.'))
}

describe('getInvalidFields', () => {
  it('reports the missing required fields, including the ones of a required object', () => {
    expect(getInvalidFields(schema, undefined, OPTIONS)).toEqual([
      { path: ['uri'], labels: ['URI'], error: REQUIRED },
      { path: ['mapping', 'attribute'], labels: ['Mapping', 'attribute'], error: REQUIRED },
    ])
  })

  it.each(['', null])('considers %j as missing', uri => {
    expect(getInvalidPaths({ uri, mapping: { attribute: 'uid' } })).toEqual(['uri'])
  })

  it('never reports a required boolean, as it is displayed unchecked', () => {
    const booleanSchema: JsonSchema = {
      type: 'object',
      properties: { enabled: { type: 'boolean' } },
      required: ['enabled'],
    }

    expect(getInvalidFields(booleanSchema, {}, OPTIONS)).toEqual([])
  })

  it('checks a value which is not an object as an empty object', () => {
    expect(getInvalidPaths('ldap://foo')).toEqual(['uri', 'mapping.attribute'])
  })

  it('reports a required list which is missing', () => {
    expect(
      getInvalidFields({ type: 'object', properties: { uris: { type: 'array' } }, required: ['uris'] }, {}, OPTIONS)
    ).toEqual([{ path: ['uris'], labels: ['uris'], error: REQUIRED }])
  })

  it('only checks an optional object when it is used', () => {
    const value = { uri: 'ldap://foo', mapping: { attribute: 'uid' } }

    expect(getInvalidPaths(value)).toEqual([])
    expect(getInvalidPaths({ ...value, bind: { dn: 'cn=admin' } })).toEqual(['bind.password'])
  })

  it('labels the items without title like the list field', () => {
    expect(
      getInvalidFields(schema, { uri: 'ldap://foo', mapping: { attribute: 'uid' }, failoverUris: [''] }, OPTIONS)
    ).toEqual([{ path: ['failoverUris', '0'], labels: ['failoverUris', 'Item 1'], error: REQUIRED }])
  })

  it('reports the empty items of a list', () => {
    expect(
      getInvalidPaths({ uri: 'ldap://foo', mapping: { attribute: 'uid' }, failoverUris: ['ldap://bar', ''] })
    ).toEqual(['failoverUris.1'])
  })

  it('checks the items of a list of objects', () => {
    expect(
      getInvalidFields(
        schema,
        {
          uri: 'ldap://foo',
          mapping: { attribute: 'uid' },
          domains: [{ uri: 'ldap://bar' }, {}],
        },
        OPTIONS
      )
    ).toEqual([{ path: ['domains', '1', 'uri'], labels: ['domains', 'Domain 2', 'uri'], error: REQUIRED }])
  })

  describe('constraints', () => {
    const constrainedSchema: JsonSchema = {
      type: 'object',
      properties: {
        port: { type: 'integer', minimum: 1, maximum: 65535 },
        ratio: { type: 'number' },
        hosts: { type: 'array', items: { type: 'string' }, minItems: 2 },
        ports: { type: 'array', items: { type: 'integer', minimum: 1 } },
      },
    }

    function getErrors(value: unknown) {
      return getInvalidFields(constrainedSchema, value, OPTIONS).map(({ path, error }) => ({ path, error }))
    }

    it.each([
      [{ port: 1.5 }, { rule: 'integer' }],
      [{ port: 0 }, { rule: 'minimum', limit: 1 }],
      [{ port: 65536 }, { rule: 'maximum', limit: 65535 }],
    ])('reports %j as breaking the %j rule', (value, error) => {
      expect(getErrors(value)).toEqual([{ path: ['port'], error }])
    })

    it.each([1, 389, 65535])('accepts %j, the limits being included', port => {
      expect(getErrors({ port })).toEqual([])
    })

    it('accepts a decimal number for a number field', () => {
      expect(getErrors({ ratio: 1.5 })).toEqual([])
    })

    it('reports a list with too few items', () => {
      expect(getErrors({ hosts: ['ldap.example.org'] })).toEqual([
        { path: ['hosts'], error: { rule: 'min-items', limit: 2 } },
      ])
    })

    it('accepts a list with enough items', () => {
      expect(getErrors({ hosts: ['ldap.example.org', 'ldap.example.com'] })).toEqual([])
    })

    it('does not check the items count of an optional list which is not set', () => {
      expect(getErrors({})).toEqual([])
    })

    it('checks the constraints of the items of a list', () => {
      expect(getErrors({ ports: [389, 0] })).toEqual([{ path: ['ports', '1'], error: { rule: 'minimum', limit: 1 } }])
    })
  })

  it('returns nothing for a schema which is not an object', () => {
    expect(getInvalidFields({ type: 'string' }, undefined, OPTIONS)).toEqual([])
  })
})

describe('toPathKey', () => {
  it('joins the keys and indexes of the path', () => {
    expect(toPathKey(['domains', '1', 'uri'])).toBe('domains.1.uri')
  })
})

describe('isPathWithin', () => {
  it('is true for a descendant path', () => {
    expect(isPathWithin(['bind', 'dn'], ['bind'])).toBe(true)
  })

  it('is true for the same path', () => {
    expect(isPathWithin(['bind'], ['bind'])).toBe(true)
  })

  it('is true for any path within the root', () => {
    expect(isPathWithin(['bind'], [])).toBe(true)
  })

  it('is false for a sibling path', () => {
    expect(isPathWithin(['uri'], ['bind'])).toBe(false)
  })

  it('is false for an ancestor path', () => {
    expect(isPathWithin(['bind'], ['bind', 'dn'])).toBe(false)
  })
})
