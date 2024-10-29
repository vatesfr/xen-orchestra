'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const { forEach, isInteger } = require('lodash')

const { LEVELS, NAMES, resolve } = require('./_levels')

describe('LEVELS', () => {
  it('maps level names to their integer values', () => {
    forEach(LEVELS, (value, name) => {
      assert.strictEqual(isInteger(value), true)
    })
  })
})

describe('NAMES', () => {
  it('maps level values to their names', () => {
    forEach(LEVELS, (value, name) => {
      assert.strictEqual(NAMES[value], name)
    })
  })
})

describe('resolve()', () => {
  it('returns level values either from values or names', () => {
    forEach(LEVELS, value => {
      assert.strictEqual(resolve(value), value)
    })
    forEach(NAMES, (name, value) => {
      assert.strictEqual(resolve(name), +value)
    })
  })
})
