// @ts-check

import moment from 'moment-timezone'
import assert from 'node:assert'
/**
 * @typedef {import('moment-timezone').Moment} Moment
 */
/**
 * @typedef {Object} LTRSettings
 * @property {number} [firstHourOfTheDay] - First hour of the day (for daily retention)
 * @property {number} [firstDayOfWeek] - First day of the week (for weekly retention)
 * @property {number} [firstDayOfMonth] - First day of the month (for monthly retention)
 * @property {number} [firstDayOfYear] - First day of the year (for yearly retention)
 */

/**
 * @typedef {Object} LTRConfig
 * @property {number} retention - Number of time buckets to retain
 * @property {LTRSettings} [settings] - Optional settings for the retention period
 */

/**
 * @typedef {Object} LongTermRetention
 * @property {LTRConfig} [daily] - Daily retention configuration
 * @property {LTRConfig} [weekly] - Weekly retention configuration
 * @property {LTRConfig} [monthly] - Monthly retention configuration
 * @property {LTRConfig} [yearly] - Yearly retention configuration
 */

/**
 * @typedef {Object} Entry
 * @property {number | undefined} timestamp - Unix timestamp of the entry
 * @property {string} id
 * @property {*} [key] - Any other properties
 */

/**
 * @typedef {Object} DateBucket
 * @property {number} remaining - Number of remaining buckets to fill
 * @property {string|null} lastMatchingBucket - Last bucket key that was matched
 * @property {(date: Moment) => string} formatter - Function to format date into bucket key
 * @property {Object.<string, Entry>} entries - Map of bucket keys to entries
 */

/**
 * @typedef {Object} LTRDefinition
 * @property {(options: {firstHourOfTheDay?: number, firstDayOfWeek?: number, firstDayOfMonth?: number, firstDayOfYear?: number, dateCreator: (date: Moment) => Moment}) => (date: Moment) => string} makeDateFormatter
 * @property {string} [ancestor] - Name of the parent retention period
 */

/**
 * Creates a function that converts dates to moment objects in a specific timezone
 * @param {string|undefined} timezone - IANA timezone string (e.g., 'America/New_York')
 * @returns {(date: Moment | number) => Moment} Function that creates timezoned moment objects
 */

function instantiateTimezonedDateCreator(timezone) {
  return date => {
    const transformed = timezone ? moment.tz(date, timezone) : moment(date)
    assert.ok(transformed.isValid(), `date ${date} , timezone ${timezone} is invalid`)
    return transformed
  }
}

/**
 * @type {Object.<string, LTRDefinition>}
 */
const LTR_DEFINITIONS = {
  daily: {
    makeDateFormatter: ({ firstHourOfTheDay = 0, dateCreator }) => {
      return date => {
        const copy = dateCreator(date)
        copy.hour(copy.hour() - firstHourOfTheDay)
        return copy.format('YYYY-MM-DD')
      }
    },
  },
  weekly: {
    makeDateFormatter: ({ firstDayOfWeek = 0 /* relative to timezone week start */, dateCreator }) => {
      return date => {
        const copy = dateCreator(date)

        copy.date(copy.date() - firstDayOfWeek)
        // warning, the year in term of week may different from YYYY
        // since the computation of the first week of a year is timezone dependent
        return copy.format('gggg-ww')
      }
    },
    ancestor: 'daily',
  },
  monthly: {
    makeDateFormatter: ({ firstDayOfMonth = 0, dateCreator }) => {
      return date => {
        const copy = dateCreator(date)
        copy.date(copy.date() - firstDayOfMonth)
        return copy.format('YYYY-MM')
      }
    },
    ancestor: 'weekly',
  },
  yearly: {
    makeDateFormatter: ({ firstDayOfYear = 0, dateCreator }) => {
      return date => {
        const copy = dateCreator(date)
        copy.date(copy.date() - firstDayOfYear)
        return copy.format('YYYY')
      }
    },
    ancestor: 'monthly',
  },
}
/**
 * Groups entries into date buckets based on long-term retention configuration
 * @template {Entry} T
 * @param {Array<T>} entries - Array of entries sorted in descending order by timestamp
 * @param {LongTermRetention} longTermRetention - Configuration for retention periods
 * @param {string | undefined} timezone - IANA timezone string
 * @returns {Object.<string, DateBucket>} Map of retention period names to their date buckets
 */

export function getLtrEntries(entries, longTermRetention, timezone) {
  /**
   * @type  {Object.<string, DateBucket>}
   */
  const dateBuckets = {}
  if (!longTermRetention || Object.keys(longTermRetention).length === 0) {
    return {}
  }
  const dateCreator = instantiateTimezonedDateCreator(timezone)
  // only check buckets that have a retention set
  for (const [duration, { retention, settings }] of Object.entries(longTermRetention)) {
    assert.notStrictEqual(LTR_DEFINITIONS[duration], undefined, `Retention of type ${duration} is not defined`)
    assert.notStrictEqual(
      timezone,
      undefined,
      `timezone must defined for ltr, got ${JSON.stringify({ longTermRetention, timezone })}`
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
  let previousTimestamp = -1
  for (let i = nb - 1; i >= 0; i--) {
    const entry = entries[i]
    // force it so the compiler is sure we have a timestamp
    if (entry.timestamp === undefined) {
      assert.notStrictEqual(
        entry.timestamp,
        undefined,
        `Can't compute long term retention if entries don't have a timestamp`
      )
      continue
    }
    assert.ok(
      previousTimestamp === -1 || entry.timestamp < previousTimestamp,
      `entries must be sorted in desc order ${new Date(entry.timestamp)} , previous :  > ${new Date(previousTimestamp)} `
    )
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
  }

  return dateBuckets
}

/**
 * return the status of an entry
 * @param {Array<Entry>} entries
 * @param {Entry} entry
 * @param {LongTermRetention} longTermRetention - Configuration for retention periods
 * @param {string | undefined} timezone - IANA timezone string
 * @returns {Array<{duration: string, dateBucket:string}>}
 */
export function getEntryStatus(entries, entry, longTermRetention, timezone) {
  const dateBuckets = getLtrEntries(entries, longTermRetention, timezone)
  const entryBuckets = []
  for (const [duration, { entries }] of Object.entries(dateBuckets)) {
    for (const [dateBucket, bucketEntry] of Object.entries(entries)) {
      if (entry.id === bucketEntry.id) {
        entryBuckets.push({ duration, dateBucket })
      }
    }
  }
  return entryBuckets
}

// returns all entries but the last retention-th
/**
 * return the entries too old to be kept
 *  if multiple entries are i the same time bucket : keep only the oldest one
 *  if an entry is valid in any of the bucket OR the  minRetentionCount : keep it
 *  if a bucket is completely empty : it does not count as one, thus it may extend the retention
 *
 * @param {number} minRetentionCount - Minimum number of most recent entries to always keep
 * @param {Array<Entry>} entries - Array of entries sorted in descending order by timestamp
 * @param {Object} options - Additional options
 * @param {LongTermRetention} [options.longTermRetention={}] - Configuration for retention periods
 * @param {string | undefined} [options.timezone] - IANA timezone string
 * @returns {Array<Entry>} Array of entries that can be removed
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
  const dateBuckets = getLtrEntries(entries, longTermRetention, timezone)

  const kept = new Set(entries.filter((_, index) => index >= entries.length - minRetentionCount))
  /**
   * @type {Set<Entry>}
   */
  for (const { entries } of Object.values(dateBuckets)) {
    for (const entry of Object.values(entries)) {
      kept.add(entry)
    }
  }

  // ensure order is the same as the source
  const oldEntries = entries.filter((entry, index) => {
    return !kept.has(entry)
  })

  return oldEntries
}
