/* eslint-env jest */

import mapValues from 'lodash/mapValues'
import { DateTime } from 'luxon'

import next from './next'
import parse from './parse'

const N = (pattern, fromDate = '2018-04-09T06:25') =>
  next(parse(pattern), DateTime.fromISO(fromDate, { zone: 'utc' })).toISO({
    includeOffset: false,
    suppressMilliseconds: true,
    suppressSeconds: true,
  })

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
        expect(N(pattern)).toBe(result)
      })
  )

  it('select first between month-day and week-day', () => {
    expect(N('* * 10 * wen')).toBe('2018-04-10T00:00')
    expect(N('* * 12 * wen')).toBe('2018-04-11T00:00')
  })

  it('select the last available day of a month', () => {
    expect(N('* * 29 feb *')).toBe('2020-02-29T00:00')
  })

  it('fails when no solutions has been found', () => {
    expect(() => N('0 0 30 feb *')).toThrow(
      'no solutions found for this schedule'
    )
  })
})
