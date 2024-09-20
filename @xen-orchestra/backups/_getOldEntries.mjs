const LTR_DEFINITIONS = {
  daily: {
    makeDateFormatter: ({ firstHourOfTheDay = 0 } = {}) => {
      return date => {
        const copy = new Date(date)
        copy.setHours(copy.getHours() - firstHourOfTheDay)
        return `${copy.getFullYear()}-${copy.getMonth()}-${copy.getDate()}`
      }
    },
  },
  weekly: {
    makeDateFormatter: ({ firstDayOfWeek = 1 /* sunday is 0 , let's use monday as default instead */ } = {}) => {
      return date => {
        const copy = new Date(date)
        copy.setDate(date.getDate() - ((date.getDay() + 7 - firstDayOfWeek) % 7))
        return `${copy.getFullYear()}-${copy.getMonth()}-${copy.getDate()}`
      }
    },
    ancestor: 'daily',
  },
  monthly: {
    makeDateFormatter: ({ firstDayOfMonth = 0 } = {}) => {
      return date => {
        const copy = new Date(date)
        copy.setDate(copy.getDate() - firstDayOfMonth)
        return `${copy.getFullYear()}-${copy.getMonth()}`
      }
    },
    ancestor: 'weekly',
  },
  yearly: {
    makeDateFormatter: () => {
      return date => `${date.getFullYear()}`
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
export function getOldEntries(minRetentionCount, entries, { longTermRetention = {} } = {}) {
  const dateBuckets = {}
  for (const [duration, { retention, settings }] of Object.entries(longTermRetention)) {
    if (LTR_DEFINITIONS[duration] === undefined) {
      throw new Error(`Retention of type ${retention} is invalid`)
    }
    dateBuckets[duration] = {
      remaining: retention,
      lastMatchingBucket: null,
      formatter: LTR_DEFINITIONS[duration].makeDateFormatter(settings),
    }
  }
  const nb = entries.length
  const oldEntries = []

  for (let i = nb - 1; i >= 0; i--) {
    const entry = entries[i]
    const entryDate = new Date(entry.timestamp)
    let shouldBeKept = false
    for (const [duration, { remaining, lastMatchingBucket, formatter }] of Object.entries(dateBuckets)) {
      if (remaining === 0) {
        continue
      }
      const bucket = formatter(entryDate)
      if (lastMatchingBucket !== bucket) {
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
