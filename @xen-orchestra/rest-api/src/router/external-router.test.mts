import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// this module depends on the IoC container, which cannot be initialized on its own
// because of circular imports between the services: load the generated routes first,
// like `index.mts` does
import '../open-api/routes/routes.js'

import { buildZodSchema, coerceQueryParams } from './external-router.mjs'
import type { RouteDefinition } from './types.mjs'

const def: RouteDefinition['query'] = {
  bool: { type: 'boolean', optional: true },
  num: { type: 'number', optional: true },
  str: { type: 'string', optional: true },
}

const coerce = (query: Record<string, unknown>) => {
  coerceQueryParams(query, def)
  return query
}

describe('coerceQueryParams', () => {
  it('coerces booleans', () => {
    assert.deepEqual(coerce({ bool: 'true' }), { bool: true })
    assert.deepEqual(coerce({ bool: 'false' }), { bool: false })
    assert.deepEqual(coerce({ bool: 'TRUE' }), { bool: true })
    assert.deepEqual(coerce({ bool: 'FALSE' }), { bool: false })
  })
  it('keeps non-boolean values as strings', () => {
    assert.deepEqual(coerce({ bool: 'abc' }), { bool: 'abc' })
  })

  it('coerces numbers', () => {
    assert.deepEqual(coerce({ num: '42' }), { num: 42 })
    assert.deepEqual(coerce({ num: '-4.2' }), { num: -4.2 })
  })

  it('coerces a non-numeric value to NaN, which fails the validation', () => {
    assert.ok(Number.isNaN(coerce({ num: 'abc' }).num))
  })
  it('coerces empty strings to NaN, which fails the validation', () => {
    assert.ok(Number.isNaN(coerce({ num: '' }).num))
  })

  it('leaves strings and undeclared params untouched', () => {
    assert.deepEqual(coerce({ str: '42', other: 'true' }), { str: '42', other: 'true' })
  })
})

describe('buildZodSchema', () => {
  it('accepts a value, `null` and an absent value for a nullable optional field', () => {
    const schema = buildZodSchema({ port: { type: 'number', optional: true, nullable: true } })

    assert.deepEqual(schema.parse({ port: 42 }), { port: 42 })
    assert.deepEqual(schema.parse({ port: null }), { port: null })
    assert.deepEqual(schema.parse({}), {})
  })

  it('rejects `null` for a field which is only optional', () => {
    const schema = buildZodSchema({ port: { type: 'number', optional: true } })

    assert.throws(() => schema.parse({ port: null }))
  })
})
