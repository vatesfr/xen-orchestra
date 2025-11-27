import moment from 'moment-timezone'
import assert from 'node:assert'

function instantiateTimezonedDateCreator(timezone) {
  return date => {
    const transformed = timezone ? moment.tz(date, timezone) : moment(date)
    assert.ok(transformed.isValid(), `date ${date} , timezone ${timezone} is invalid`)
    return transformed
  }
}

const LTR_DEFINITIONS = {
  daily: {
    makeDateFormatter: ({ firstHourOfTheDay = 0, dateCreator } = {}) => {
      return date => {
        const copy = dateCreator(date)
        copy.hour(copy.hour() - firstHourOfTheDay)
        return copy.format('YYYY-MM-DD')
      }
    },
  },
  weekly: {
    makeDateFormatter: ({ firstDayOfWeek = 0 /* relative to timezone week start */, dateCreator } = {}) => {
      return date => {
        const copy = dateCreator(date)

        copy.date(date.date() - firstDayOfWeek)
        // warning, the year in term of week may different from YYYY
        // since the computation of the first week of a year is timezone dependent
        return copy.format('gggg-ww')
      }
    },
    ancestor: 'daily',
  },
  monthly: {
    makeDateFormatter: ({ firstDayOfMonth = 0, dateCreator } = {}) => {
      return date => {
        const copy = dateCreator(date)
        copy.date(copy.date() - firstDayOfMonth)
        return copy.format('YYYY-MM')
      }
    },
    ancestor: 'weekly',
  },
  yearly: {
    makeDateFormatter: ({ firstDayOfYear = 0, dateCreator } = {}) => {
      return date => {
        const copy = dateCreator(date)
        copy.date(copy.date() - firstDayOfYear)
        return copy.format('YYYY')
      }
    },
    ancestor: 'monthly',
  },
}

// returns all entries but the last retention-th
/**
 * return the entries too old to be kept
 *  if multiple entries are i the same time bucket : keep only the most recent one
 *  if an entry is valid in any of the bucket OR the  minRetentionCount : keep it
 *  if a bucket is completely empty : it does not count as one, thus it may extend the retention
 * @returns Array<Backup>
 */
export function getOldEntries(minRetentionCount, entries, { longTermRetention = {}, timezone } = {}) {
  assert.strictEqual(
    typeof minRetentionCount,
    'number',
    `minRetentionCount must be a number, got ${JSON.stringify(minRetentionCount)}`
  )
  assert.strictEqual(
    minRetentionCount >= 0,
    true,
    `minRetentionCount must be a positive number, got ${JSON.stringify(minRetentionCount)}`
  )
  const dateBuckets = {}
  const dateCreator = instantiateTimezonedDateCreator(timezone)
  // only check buckets that have a retention set
  for (const [duration, { retention, settings }] of Object.entries(longTermRetention)) {
    assert.notStrictEqual(LTR_DEFINITIONS[duration], undefined, `Retention of type ${duration} is not defined`)
    assert.notStrictEqual(
      timezone,
      undefined,
      `timezone must defined for ltr, got ${JSON.stringify({ minRetentionCount, longTermRetention, timezone })}`
    )
    assert.strictEqual(
      typeof retention,
      'number',
      `retention  of type ${duration} must be a number, got ${JSON.stringify(retention)}`
    )
    assert.strictEqual(
      retention > 0,
      true,
      `retention  of type ${duration} must be a positive number, got ${JSON.stringify(retention)}`
    )
    dateBuckets[duration] = {
      remaining: retention,
      lastMatchingBucket: null,
      formatter: LTR_DEFINITIONS[duration].makeDateFormatter({ ...settings, dateCreator }),
      entries: {}, // bucket => entry id
    }
  }
  const nb = entries.length
  const minDurationEntries = []
  let previousTimestamp = -1
  for (let i = nb - 1; i >= 0; i--) {
    const entry = entries[i]
    if (entry.timestamp !== undefined) {
      // we go through the entries from the last (most recent) to the first (oldest)
      assert.ok(
        previousTimestamp === -1 || entry.timestamp < previousTimestamp,
        `entries must be sorted in desc order ${new Date(entry.timestamp)} , previous :  > ${new Date(previousTimestamp)} `
      )
      previousTimestamp = entry.timestamp
      const entryDate = dateCreator(entry.timestamp)
      for (const [duration, { remaining, lastMatchingBucket, formatter }] of Object.entries(dateBuckets)) {
        const bucket = formatter(entryDate)
        if (lastMatchingBucket !== bucket) {
          if (remaining === 0) {
            continue
          }
          dateBuckets[duration].lastMatchingBucket = bucket
          dateBuckets[duration].remaining -= 1
        }
        dateBuckets[duration].entries[bucket] = entry
      }
    } else {
      // replicated VM entries or snapshot retention don't have a timestamp
      // but also can't have LTR
      assert.deepStrictEqual(
        longTermRetention,
        {},
        "Can't compute long term retention if entries don't have a timestamp"
      )
    }

    // also keep it on retention
    if (i >= nb - minRetentionCount) {
      minDurationEntries.push(entry)
    }
  }
  const kept = new Set(minDurationEntries)
  for (const { entries } of Object.values(dateBuckets)) {
    for (const entry of Object.values(entries)) {
      kept.add(entry)
    }
  }

  // ensure order is the same as the source
  const oldEntries = entries.filter(entry => {
    return !kept.has(entry)
  })

  return oldEntries
}
