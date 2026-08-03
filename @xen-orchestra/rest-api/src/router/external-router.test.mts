import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

// this module depends on the IoC container, which cannot be initialized on its own
// because of circular imports between the services: load the generated routes first,
// like `index.mts` does
import '../open-api/routes/routes.js'

import { coerceQueryParams } from './external-router.mjs'
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
  })

  it('coerces numbers', () => {
    assert.deepEqual(coerce({ num: '42' }), { num: 42 })
    assert.deepEqual(coerce({ num: '-4.2' }), { num: -4.2 })
  })

  it('coerces a non-numeric value to NaN, which fails the validation', () => {
    assert.ok(Number.isNaN(coerce({ num: 'abc' }).num))
  })

  it('leaves strings and undeclared params untouched', () => {
    assert.deepEqual(coerce({ str: '42', other: 'true' }), { str: '42', other: 'true' })
  })
})
