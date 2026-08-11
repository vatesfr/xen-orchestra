import test from 'node:test'
import { strict as assert } from 'node:assert'

import { formatJournalDate, parseJournalDate } from './_backupJournal.mjs'

const { describe } = test

describe('formatJournalDate()', () => {
  test('round trips through parseJournalDate()', () => {
    for (const timestamp of [0, 1786373412482, Date.UTC(2026, 11, 31, 23, 59, 59, 999)]) {
      assert.equal(parseJournalDate(formatJournalDate(timestamp)).getTime(), timestamp)
    }
  })

  test('is fixed width, therefore lexicographically sortable', () => {
    const timestamps = [
      0,
      // same second
      Date.UTC(2026, 7, 10, 10, 30, 12, 1),
      Date.UTC(2026, 7, 10, 10, 30, 12, 482),
      // day boundary
      Date.UTC(2026, 7, 10, 23, 59, 59, 999),
      Date.UTC(2026, 7, 11, 0, 0, 0, 0),
      // year boundary
      Date.UTC(2026, 11, 31, 23, 59, 59, 999),
      Date.UTC(2027, 0, 1, 0, 0, 0, 0),
    ]

    const dates = timestamps.map(formatJournalDate)
    assert.equal(new Set(dates.map(_ => _.length)).size, 1)
    assert.deepEqual([...dates].sort(), dates)
  })
})

describe('parseJournalDate()', () => {
  test('returns null on names which are not journal entries', () => {
    for (const name of ['', 'README', '20260810T103012Z.json', 'cache.json.gz'.slice(0, 20)]) {
      assert.equal(parseJournalDate(name), null)
    }
  })
})
