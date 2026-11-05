import { getJsonSchemaValueSections } from '@/modules/plugin/utils/json-schema-value.util.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { OBFUSCATED_VALUE } from '@/shared/constants.ts'
import { getItemLabel } from '@/test/json-schema-item-label.ts'

function getSections(schema: JsonSchema, value: unknown) {
  return getJsonSchemaValueSections(schema, value, { getItemLabel })
}

function getRows(properties: Record<string, JsonSchema>, value: Record<string, unknown>) {
  const [section] = getSections({ type: 'object', properties }, value)

  return section.rows
}

function getRow(schema: JsonSchema, value: unknown) {
  const [row] = getRows({ property: schema }, { property: value })

  return row
}

describe('getJsonSchemaValueSections', () => {
  it('has no section for a schema without properties', () => {
    expect(getSections({ type: 'object' }, { host: 'smtp.example.org' })).toEqual([])
  })

  it('lists every property of the schema, in order and with its label, even when unset', () => {
    expect(
      getRows({ host: { type: 'string', title: 'Host' }, port: { type: 'integer' } }, { port: 587, ignored: true })
    ).toEqual([
      { key: 'host', label: 'Host', kind: 'text', text: undefined },
      { key: 'port', label: 'port', kind: 'text', text: '587' },
    ])
  })

  it.each([undefined, null, '', []])('displays %j as an empty value', value => {
    expect(getRow({ type: 'string' }, value)).toMatchObject({ kind: 'text', text: undefined })
  })

  it('displays the label of an enum value', () => {
    expect(getRow({ enum: ['tls', 'none'], enumNames: ['TLS', 'None'] }, 'tls')).toMatchObject({ text: 'TLS' })
  })

  it('displays an enum value without label as is', () => {
    expect(getRow({ enum: ['tls', 'none'] }, 'tls')).toMatchObject({ text: 'tls' })
  })

  it.each([true, false])('displays the boolean %s as a status', enabled => {
    expect(getRow({ type: 'boolean' }, enabled)).toMatchObject({ kind: 'boolean', enabled })
  })

  it('displays an unset boolean as an empty value', () => {
    expect(getRow({ type: 'boolean' }, undefined)).toMatchObject({ kind: 'text', text: undefined })
  })

  it('hides the value of a secret', () => {
    expect(getRows({ password: { type: 'string' } }, { password: 'hunter2' })).toEqual([
      { key: 'password', label: 'password', kind: 'secret' },
    ])
  })

  it('hides the value obfuscated by the API', () => {
    expect(getRow({ type: 'string' }, OBFUSCATED_VALUE)).toMatchObject({ kind: 'secret' })
  })

  it('displays an unset secret as an empty value', () => {
    expect(getRows({ password: { type: 'string' } }, {})).toEqual([
      { key: 'password', label: 'password', kind: 'text', text: undefined },
    ])
  })

  it('references the XO object of the value', () => {
    expect(getRow({ type: 'string', $type: 'Pool' }, 'pool-1')).toMatchObject({
      kind: 'xo-object',
      objectType: 'pool',
      ids: ['pool-1'],
    })
  })

  it('references the XO objects of the values', () => {
    expect(getRow({ type: 'array', items: { type: 'string', $type: 'Tag' } }, ['prod', 'web'])).toMatchObject({
      kind: 'xo-object',
      objectType: 'tag',
      ids: ['prod', 'web'],
    })
  })

  it('displays an unset XO object as an empty value', () => {
    expect(getRow({ type: 'string', $type: 'VM' }, undefined)).toMatchObject({ kind: 'text', text: undefined })
  })

  it('lists the items of an array, with their enum label', () => {
    expect(
      getRow({ type: 'array', items: { enum: ['error', 'success'], enumNames: ['Error', 'Success'] } }, [
        'error',
        'success',
      ])
    ).toMatchObject({ kind: 'list', items: ['Error', 'Success'] })
  })

  it('skips the empty items of an array', () => {
    expect(getRow({ type: 'array', items: { type: 'string' } }, ['web', '', 'db'])).toMatchObject({
      kind: 'list',
      items: ['web', 'db'],
    })
  })

  it('displays an array of empty items as an empty value', () => {
    expect(getRow({ type: 'array', items: { type: 'string' } }, ['', null])).toMatchObject({
      kind: 'text',
      text: undefined,
    })
  })

  it('displays an object without properties as JSON', () => {
    expect(getRow({ type: 'object' }, { level: 1 })).toMatchObject({ text: '{"level":1}' })
  })

  it('displays a nested object in its own section, after the section of its parent', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        transport: { type: 'object', title: 'Transport', properties: { host: { type: 'string' } } },
        from: { type: 'string' },
      },
    }

    expect(getSections(schema, { transport: { host: 'smtp.example.org' }, from: 'xo@example.org' })).toEqual([
      { key: '', labels: [], rows: [{ key: 'from', label: 'from', kind: 'text', text: 'xo@example.org' }] },
      {
        key: 'transport',
        labels: ['Transport'],
        rows: [{ key: 'transport.host', label: 'host', kind: 'text', text: 'smtp.example.org' }],
      },
    ])
  })

  it('omits a section without rows', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: { transport: { type: 'object', properties: { host: { type: 'string' } } } },
    }

    expect(getSections(schema, undefined)).toEqual([
      {
        key: 'transport',
        labels: ['transport'],
        rows: [{ key: 'transport.host', label: 'host', kind: 'text', text: undefined }],
      },
    ])
  })

  it('displays each object item of an array in its own section', () => {
    const schema: JsonSchema = {
      type: 'object',
      properties: {
        servers: {
          type: 'array',
          title: 'Servers',
          items: { type: 'object', title: 'Server', properties: { host: { type: 'string' } } },
        },
      },
    }

    expect(getSections(schema, { servers: [{ host: 'ldap1' }, { host: 'ldap2' }] })).toEqual([
      {
        key: 'servers.0',
        labels: ['Servers', 'Server 1'],
        rows: [{ key: 'servers.0.host', label: 'host', kind: 'text', text: 'ldap1' }],
      },
      {
        key: 'servers.1',
        labels: ['Servers', 'Server 2'],
        rows: [{ key: 'servers.1.host', label: 'host', kind: 'text', text: 'ldap2' }],
      },
    ])
  })

  it('displays an empty array of objects as an empty value', () => {
    expect(
      getRow({ type: 'array', items: { type: 'object', properties: { host: { type: 'string' } } } }, [])
    ).toMatchObject({ kind: 'text', text: undefined })
  })
})
