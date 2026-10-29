import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { invalidParameters } from 'xo-common/api-errors.js'

import { assertValidExpression, assertValidSettingsExpression } from './_backupExpressions.mjs'

const VALID = 'vm:tags:prod'
const INVALID = 'vm:('

// checks that the error is `invalidParameters` and points to the expected field
const isInvalidAt = instancePath => error =>
  invalidParameters.is(error) && error.data.errors[0].instancePath === instancePath

describe('assertValidExpression', function () {
  it('accepts a valid expression', function () {
    assert.doesNotThrow(() => assertValidExpression('srs', VALID))
  })

  it('rejects an invalid expression with invalidParameters', function () {
    assert.throws(() => assertValidExpression('srs', INVALID), isInvalidAt('/srs'))
  })

  it('ignores values which are not expressions', function () {
    for (const value of [undefined, '', { id: 'sr-1' }, { id: { __or: ['sr-1', 'sr-2'] } }]) {
      assert.doesNotThrow(() => assertValidExpression('srs', value))
    }
  })
})

describe('assertValidSettingsExpression', function () {
  const KEYS = ['healthCheckVmsWithTags', 'fullInterval']

  it('accepts valid expressions in the general and the schedule settings', function () {
    assert.doesNotThrow(() =>
      assertValidSettingsExpression(
        { '': { fullInterval: VALID }, 'schedule-1': { healthCheckVmsWithTags: VALID } },
        KEYS
      )
    )
  })

  it('rejects an invalid expression in the schedule settings and points to it', function () {
    assert.throws(
      () => assertValidSettingsExpression({ '': {}, 'schedule-1': { fullInterval: INVALID } }, KEYS),
      isInvalidAt('/settings/schedule-1/fullInterval')
    )
  })

  it('rejects an invalid expression in the general settings', function () {
    // the general settings are keyed by '', hence the empty segment in the path
    assert.throws(
      () => assertValidSettingsExpression({ '': { healthCheckVmsWithTags: INVALID } }, KEYS),
      isInvalidAt('/settings//healthCheckVmsWithTags')
    )
  })

  it('ignores the legacy array and number values', function () {
    assert.doesNotThrow(() =>
      assertValidSettingsExpression({ 'schedule-1': { healthCheckVmsWithTags: ['tag'], fullInterval: 3 } }, KEYS)
    )
  })

  it('ignores the keys it has not been asked to check', function () {
    assert.doesNotThrow(() => assertValidSettingsExpression({ 'schedule-1': { vmFilter: INVALID } }, KEYS))
  })

  it('handles missing settings and undefined entries', function () {
    assert.doesNotThrow(() => assertValidSettingsExpression(undefined, KEYS))
    assert.doesNotThrow(() => assertValidSettingsExpression({ 'schedule-1': undefined }, KEYS))
  })
})
