import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { asArray, normalizeSoapValue } from './normalize.mjs'

describe('asArray', function () {
  it('wraps a single element', function () {
    assert.deepEqual(asArray('a'), ['a'])
    assert.deepEqual(asArray({ a: 1 }), [{ a: 1 }])
  })

  it('keeps an array as is', function () {
    const array = ['a', 'b']
    assert.equal(asArray(array), array)
  })

  it('returns an empty array for an absent element', function () {
    assert.deepEqual(asArray(undefined), [])
    assert.deepEqual(asArray(null), [])
  })
})

describe('normalizeSoapValue', function () {
  it('unwraps a scalar', function () {
    assert.equal(normalizeSoapValue({ $value: 'poweredOn', attributes: { 'xsi:type': 'string' } }), 'poweredOn')
  })

  it('unwraps a falsy scalar', function () {
    assert.equal(normalizeSoapValue({ $value: '' }), '')
    assert.equal(normalizeSoapValue({ $value: 0 }), 0)
    assert.equal(normalizeSoapValue({ $value: false }), false)
  })

  it('unwraps a managed object reference to its value', function () {
    assert.equal(normalizeSoapValue({ attributes: { type: 'Datastore' }, $value: 'datastore-11' }), 'datastore-11')
  })

  it('drops the attributes of a complex type', function () {
    assert.deepEqual(
      normalizeSoapValue({ attributes: { 'xsi:type': 'VirtualMachineConfigInfo' }, name: 'vm', guestId: 'ubuntu64' }),
      { name: 'vm', guestId: 'ubuntu64' }
    )
  })

  it('does not touch a value without attributes', function () {
    const value = { name: 'vm' }
    assert.equal(normalizeSoapValue(value), value)
  })

  it('leaves the nested values as they are', function () {
    assert.deepEqual(normalizeSoapValue({ attributes: {}, hardware: { memoryMB: '2048' } }), {
      hardware: { memoryMB: '2048' },
    })
  })

  it('passes primitives and null through', function () {
    assert.equal(normalizeSoapValue('poweredOff'), 'poweredOff')
    assert.equal(normalizeSoapValue(null), null)
    assert.equal(normalizeSoapValue(undefined), undefined)
  })
})
