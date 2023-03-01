'use strict'

const { describe, it } = require('test')
const assert = require('assert').strict

const mapValues = require('lodash/mapValues')
const moment = require('moment-timezone')

const next = require('./next')
const parse = require('./parse')

const N = (pattern, fromDate = '2018-04-09T06:25') => {
  const iso = next(parse(pattern), moment.utc(fromDate)).toISOString()
  return iso.slice(0, iso.lastIndexOf(':'))
}

describe('next()', () => {
  mapValues(
    {
      minutely: ['* * * * *', '2018-04-09T06:26'],
      hourly: ['@hourly', '2018-04-09T07:00'],
      daily: ['@daily', '2018-04-10T00:00'],
      monthly: ['@monthly', '2018-05-01T00:00'],
      yearly: ['@yearly', '2019-01-01T00:00'],
      weekly: ['@weekly', '2018-04-15T00:00'],
    },
    ([pattern, result], title) =>
      it(title, () => {
        assert.strictEqual(N(pattern), result)
      })
  )

  it('select first between month-day and week-day', () => {
    assert.strictEqual(N('* * 10 * wen'), '2018-04-10T00:00')
    assert.strictEqual(N('* * 12 * wen'), '2018-04-11T00:00')
  })

  it('select the last available day of a month', () => {
    assert.strictEqual(N('* * 29 feb *'), '2020-02-29T00:00')
  })

  it('fails when no solutions has been found', () => {
    assert.throws(() => N('0 0 30 feb *'), { message: 'no solutions found for this schedule' })
  })

  it('select the first sunday of the month', () => {
    assert.strictEqual(N('* * * * 0', '2018-03-31T00:00'), '2018-04-01T00:00')
  })
})
