'use strict'

const { describe, it } = require('node:test')
const assert = require('assert').strict

const parse = require('./parse')

describe('parse()', () => {
  it('works', () => {
    assert.deepStrictEqual(parse('0 0-10 */10 jan,2,4-11/3 *'), {
      minute: [0],
      hour: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      dayOfMonth: [1, 11, 21, 31],
      month: [0, 2, 4, 7, 10],
    })
  })

  it('correctly parse months', () => {
    assert.deepStrictEqual(parse('* * * 0,11 *'), {
      month: [0, 11],
    })
    assert.deepStrictEqual(parse('* * * jan,dec *'), {
      month: [0, 11],
    })
  })

  it('correctly parse days', () => {
    assert.deepStrictEqual(parse('* * * * mon,sun'), {
      dayOfWeek: [0, 1],
    })
  })

  it('reports missing integer', () => {
    assert.throws(() => parse('*/a'), { message: 'minute: missing integer at character 2' })
    assert.throws(() => parse('*'), { message: 'hour: missing integer at character 1' })
  })

  it('reports invalid aliases', () => {
    assert.throws(() => parse('* * * jan-foo *'), { message: 'month: missing alias or integer at character 10' })
  })

  it('dayOfWeek: 0 and 7 bind to sunday', () => {
    assert.deepStrictEqual(parse('* * * * 0'), {
      dayOfWeek: [0],
    })
    assert.deepStrictEqual(parse('* * * * 7'), {
      dayOfWeek: [0],
    })
  })
})
