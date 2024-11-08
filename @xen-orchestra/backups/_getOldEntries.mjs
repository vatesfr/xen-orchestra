import moment from 'moment-timezone'
import assert from 'node:assert'

function instantiateTimezonedDateCreator(timezone) {
  return date => (timezone ? moment.tz(date, timezone) : moment(date))
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
        // since the computation of the first week of a year is timezone dependant
        return copy.format('gggg-WW')
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
 *  if a bucket is cmpletly empty : it does not count as one, thus it may extend the retention
 * @returns Array<Backup>
 */
export function getOldEntries(minRetentionCount, entries, { longTermRetention = {}, timezone } = {}) {
  const dateBuckets = {}
  const dateCreator = instantiateTimezonedDateCreator(timezone)
  // only check buckets that have a retention set
  for (const [duration, { retention, settings }] of Object.entries(longTermRetention)) {
    if (LTR_DEFINITIONS[duration] === undefined) {
      throw new Error(`Retention of type ${retention} is invalid`)
    }
    dateBuckets[duration] = {
      remaining: retention,
      lastMatchingBucket: null,
      formatter: LTR_DEFINITIONS[duration].makeDateFormatter({ ...settings, dateCreator }),
    }
  }
  const nb = entries.length
  const oldEntries = []

  for (let i = nb - 1; i >= 0; i--) {
    const entry = entries[i]
    const entryDate = dateCreator(entry.timestamp)
    let shouldBeKept = false
    for (const [duration, { remaining, lastMatchingBucket, formatter }] of Object.entries(dateBuckets)) {
      if (remaining === 0) {
        continue
      }
      const bucket = formatter(entryDate)
      if (lastMatchingBucket !== bucket) {
        if (lastMatchingBucket !== null) {
          assert.strictEqual(
            lastMatchingBucket > bucket,
            true,
            `entries must be sorted in asc order ${lastMatchingBucket} ${bucket}`
          )
        }
        shouldBeKept = true
        dateBuckets[duration].remaining -= 1
        dateBuckets[duration].lastMatchingBucket = bucket
      }
    }
    if (i >= nb - minRetentionCount) {
      shouldBeKept = true
    }
    if (!shouldBeKept) {
      oldEntries.push(entry)
    }
  }
  // we expect the entries to be in the right order
  return oldEntries.reverse()
}
