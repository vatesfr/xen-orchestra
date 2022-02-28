'use strict'

/* eslint-env jest */

const { forEach, isInteger } = require('lodash')

const { LEVELS, NAMES, resolve } = require('./levels')

describe('LEVELS', () => {
  it('maps level names to their integer values', () => {
    forEach(LEVELS, (value, name) => {
      expect(isInteger(value)).toBe(true)
    })
  })
})

describe('NAMES', () => {
  it('maps level values to their names', () => {
    forEach(LEVELS, (value, name) => {
      expect(NAMES[value]).toBe(name)
    })
  })
})

describe('resolve()', () => {
  it('returns level values either from values or names', () => {
    forEach(LEVELS, value => {
      expect(resolve(value)).toBe(value)
    })
    forEach(NAMES, (name, value) => {
      expect(resolve(name)).toBe(+value)
    })
  })
})
