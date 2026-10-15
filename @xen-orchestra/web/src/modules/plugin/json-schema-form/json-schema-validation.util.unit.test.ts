import {
  getMissingFields,
  isPathWithin,
  toPathKey,
} from '@/modules/plugin/json-schema-form/json-schema-validation.util.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'

const OPTIONS = {
  getItemLabel: (index: number, itemSchema: JsonSchema) => `${itemSchema.title ?? 'Item'} ${index + 1}`,
}

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

function getMissingPaths(value: unknown) {
  return getMissingFields(schema, value, OPTIONS).map(field => field.path.join('.'))
}

describe('getMissingFields', () => {
  it('reports the missing required fields, including the ones of a required object', () => {
    expect(getMissingFields(schema, undefined, OPTIONS)).toEqual([
      { path: ['uri'], labels: ['URI'] },
      { path: ['mapping', 'attribute'], labels: ['Mapping', 'attribute'] },
    ])
  })

  it.each(['', null])('considers %j as missing', uri => {
    expect(getMissingPaths({ uri, mapping: { attribute: 'uid' } })).toEqual(['uri'])
  })

  it('never reports a required boolean, as it is displayed unchecked', () => {
    const booleanSchema: JsonSchema = {
      type: 'object',
      properties: { enabled: { type: 'boolean' } },
      required: ['enabled'],
    }

    expect(getMissingFields(booleanSchema, {}, OPTIONS)).toEqual([])
  })

  it('checks a value which is not an object as an empty object', () => {
    expect(getMissingPaths('ldap://foo')).toEqual(['uri', 'mapping.attribute'])
  })

  it('reports a required list which is missing', () => {
    expect(
      getMissingFields({ type: 'object', properties: { uris: { type: 'array' } }, required: ['uris'] }, {}, OPTIONS)
    ).toEqual([{ path: ['uris'], labels: ['uris'] }])
  })

  it('only checks an optional object when it is used', () => {
    const value = { uri: 'ldap://foo', mapping: { attribute: 'uid' } }

    expect(getMissingPaths(value)).toEqual([])
    expect(getMissingPaths({ ...value, bind: { dn: 'cn=admin' } })).toEqual(['bind.password'])
  })

  it('labels the items without title like the list field', () => {
    expect(
      getMissingFields(schema, { uri: 'ldap://foo', mapping: { attribute: 'uid' }, failoverUris: [''] }, OPTIONS)
    ).toEqual([{ path: ['failoverUris', '0'], labels: ['failoverUris', 'Item 1'] }])
  })

  it('reports the empty items of a list', () => {
    expect(
      getMissingPaths({ uri: 'ldap://foo', mapping: { attribute: 'uid' }, failoverUris: ['ldap://bar', ''] })
    ).toEqual(['failoverUris.1'])
  })

  it('checks the items of a list of objects', () => {
    expect(
      getMissingFields(
        schema,
        {
          uri: 'ldap://foo',
          mapping: { attribute: 'uid' },
          domains: [{ uri: 'ldap://bar' }, {}],
        },
        OPTIONS
      )
    ).toEqual([{ path: ['domains', '1', 'uri'], labels: ['domains', 'Domain 2', 'uri'] }])
  })

  it('returns nothing for a schema which is not an object', () => {
    expect(getMissingFields({ type: 'string' }, undefined, OPTIONS)).toEqual([])
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
