'use strict'

const { describe, it } = require('test')
const assert = require('node:assert')

const { MultiKeyMap } = require('./')

describe('MultiKeyMap', () => {
  it('works', () => {
    const map = new MultiKeyMap()

    const keys = [
      // null key
      [],
      // simple key
      ['foo'],
      // composite key
      ['foo', 'bar'],
      // reverse composite key
      ['bar', 'foo'],
    ]
    const values = keys.map(() => ({}))

    // set all values first to make sure they are all stored and not only the
    // last one
    keys.forEach((key, i) => {
      map.set(key, values[i])
    })

    keys.forEach((key, i) => {
      // copy the key to make sure the array itself is not the key
      assert.strictEqual(map.get(key.slice()), values[i])
      map.delete(key.slice())
      assert.strictEqual(map.get(key.slice()), undefined)
    })
  })
})
