import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { getOldEntries } from './_getOldEntries.mjs'

describe('_getOldEntries() should succeed', () => {
  const tests = [
    {
      args: [
        1,
        [
          { timestamp: 1, id: 1 },
          { timestamp: 3, id: 2 },
          { timestamp: 2, id: 3 },
        ],
      ],
      expectedIds: [1, 2],
      testLabel: 'should  handle number based retention ',
    },

    {
      args: [
        0,
        [
          { timestamp: +new Date('2024-09-01 00:01:00'), id: 1 }, // too old
          { timestamp: +new Date('2024-09-01 00:00:00'), id: 2 }, // too old
          { timestamp: +new Date('2024-09-02 00:09:00'), id: 3 }, // too old in same day
          { timestamp: +new Date('2024-09-02 00:10:00'), id: 4 },
          { timestamp: +new Date('2024-09-03 00:09:00'), id: 5 },
          { timestamp: +new Date('2024-09-04 00:09:00'), id: 6 }, // too old in same day
          { timestamp: +new Date('2024-09-04 00:10:00'), id: 7 },
        ],
        {
          longTermRetention: {
            daily: { retention: 3 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      expectedIds: [1, 2, 3, 6],
      testLabel: 'should  handle day based retention  ',
    },
    {
      args: [
        0,
        [
          { timestamp: +new Date('2024-09-01 00:01:00'), id: 1 }, // week n-3 too old
          { timestamp: +new Date('2024-09-02 00:00:00'), id: 2 }, // week n-3 too old
          { timestamp: +new Date('2024-09-03 00:09:00'), id: 3 }, // week n-2
          { timestamp: +new Date('2024-09-04 00:09:00'), id: 4 }, // week n-2
          { timestamp: +new Date('2024-09-05 00:09:00'), id: 5 }, // week n-2
          { timestamp: +new Date('2024-09-06 00:09:00'), id: 6 }, // week n-2
          { timestamp: +new Date('2024-09-07 00:09:00'), id: 7 }, // week n-2, most recent kept
          { timestamp: +new Date('2024-09-09 00:09:00'), id: 8 }, // week n-1, too old
          { timestamp: +new Date('2024-09-15 00:09:00'), id: 9 }, // week n-1  kept
          { timestamp: +new Date('2024-09-22 00:09:00'), id: 10 }, // week n  kept
        ],
        {
          longTermRetention: {
            weekly: { retention: 3 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      expectedIds: [1, 2, 3, 4, 5, 6, 8],
      testLabel: 'should  handle week based retention  ',
    },
    {
      args: [
        0,
        [
          { timestamp: +new Date('2024-06-22 00:09:00'), id: 1 }, // too old
          { timestamp: +new Date('2024-07-31 00:09:00'), id: 2 }, // first of july
          { timestamp: +new Date('2024-08-01 00:09:00'), id: 3 }, // older of august
          { timestamp: +new Date('2024-08-05 00:09:00'), id: 4 }, // older of august
          { timestamp: +new Date('2024-08-07 00:09:00'), id: 5 }, // most recent of august
          { timestamp: +new Date('2024-09-09 00:09:00'), id: 6 }, // older of september
          { timestamp: +new Date('2024-09-15 00:09:00'), id: 7 }, // older of september
          { timestamp: +new Date('2024-09-22 00:09:00'), id: 8 }, // most recent of september
        ],
        {
          longTermRetention: {
            monthly: { retention: 3 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      expectedIds: [1, 3, 4, 6, 7],
      testLabel: 'should  handle month based retention',
    },
    {
      args: [
        0,
        [
          { timestamp: +new Date('2023-05-18 00:09:00'), id: 1 }, // too old
          { timestamp: +new Date('2024-06-15 00:09:00'), id: 2 }, // too old in same year
          { timestamp: +new Date('2024-07-04 00:09:00'), id: 3 }, // too old
          { timestamp: +new Date('2024-08-12 00:09:00'), id: 4 }, // too old
          { timestamp: +new Date('2024-09-05 00:09:00'), id: 5 }, // too old
          { timestamp: +new Date('2024-10-02 00:09:00'), id: 6 }, // new month,
          { timestamp: +new Date('2024-11-01 00:09:00'), id: 7 }, // new month , week reached retention
          { timestamp: +new Date('2024-12-17 00:09:00'), id: 8 }, // new week
          { timestamp: +new Date('2024-12-24 00:09:00'), id: 9 }, // new week/month / year  daily reach retention
          { timestamp: +new Date('2025-01-01 00:09:00'), id: 10 }, // same day/week/month/year
          { timestamp: +new Date('2025-01-01 00:10:00'), id: 11 }, //  new  day / week / month
          { timestamp: +new Date('2025-12-31 00:09:00'), id: 12 }, // same day/week/month/year
          { timestamp: +new Date('2025-12-31 00:09:00'), id: 13 }, // new month /year
        ],
        {
          longTermRetention: {
            daily: { retention: 2 },
            weekly: { retention: 4 },
            monthly: { retention: 5 },
            yearly: { retention: 2 },
          },
          timezone: 'Europe/Paris', // use a time zone here because week definition is timezone bound
        },
      ],
      expectedIds: [1, 2, 3, 4, 5, 10, 12],
      testLabel: 'complete test  ',
    },
    {
      args: [
        0,
        [
          { timestamp: +new Date('2024-09-01 00:01:00'), id: 1 }, // thrid day too old
          { timestamp: +new Date('2024-09-01 00:10:00'), id: 2 }, // thrid day
          { timestamp: +new Date('2024-09-01 00:20:00'), id: 3 }, // second day, too old
          { timestamp: +new Date('2024-09-02 00:22:00'), id: 4 }, // second day too old
          { timestamp: +new Date('2024-09-03 00:20:00'), id: 5 }, // second day in NZ
          { timestamp: +new Date('2024-09-04 00:09:00'), id: 6 }, // same day in NZ
          { timestamp: +new Date('2024-09-04 00:10:00'), id: 7 }, // most recent
        ],
        {
          longTermRetention: {
            daily: { retention: 3 },
          },
          timezone: 'Pacific/Auckland', // GMT +6
        },
      ],
      expectedIds: [1, 2, 3, 6],
      testLabel: 'should  handle timezone ',
    },
  ]

  for (const { args, expectedIds, testLabel } of tests) {
    it(testLabel, () => {
      const oldEntries = getOldEntries.apply(null, args)
      assert.strictEqual(
        oldEntries.length,
        expectedIds.length,
        `different length , ${JSON.stringify({ oldEntries, expectedIds })}`
      )
      for (let i = 0; i < expectedIds.length; i++) {
        assert.strictEqual(
          oldEntries[i].id,
          expectedIds[i],
          `different id , ${JSON.stringify({ i, expectedIds, oldEntries })}`
        )
      }
    })
  }
})

describe('_getOldEntries() should fail when called incorrectly', () => {
  const tests = [
    {
      args: [
        -1,
        [
          { timestamp: 1, id: 1 },
          { timestamp: 3, id: 2 },
          { timestamp: 2, id: 3 },
        ],
      ],
      testLabel: 'negative min retention ',
    },
    {
      args: [
        { not: 'a number' },
        [
          { timestamp: 1, id: 1 },
          { timestamp: 3, id: 2 },
          { timestamp: 2, id: 3 },
        ],
      ],
      testLabel: 'non number min retention ',
    },
    {
      args: [
        4,
        [
          { timestamp: 1, id: 1 },
          { timestamp: 2, id: 2 },
          { timestamp: 3, id: 3 },
        ],
        {
          longTermRetention: {
            invalidType: { retention: 3 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      testLabel: 'invalid type ltr ',
    },
    {
      args: [
        3,
        [
          { timestamp: 1, id: 1 },
          { timestamp: 3, id: 2 },
          { timestamp: 2, id: 3 },
        ],
        {
          longTermRetention: {
            daily: { retention: 0 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      testLabel: 'zero retention ltr ',
    },
    {
      args: [
        1,
        [
          { timestamp: 1, id: 1 },
          { timestamp: 2, id: 2 },
          { timestamp: 3, id: 3 },
        ],
        {
          longTermRetention: {
            daily: { retention: 'not a number' },
          },
          timezone: 'Europe/Paris',
        },
      ],
      testLabel: 'no timezone ltr ',
    },

    {
      args: [
        5,
        [
          { timestamp: new Date('2024-09-01'), id: 1 },
          { timestamp: new Date('2024-09-03'), id: 3 },
          { timestamp: new Date('2024-09-02'), id: 2 },
        ],
        {
          longTermRetention: {
            daily: { retention: 5 },
          },
          timezone: 'Europe/Paris',
        },
      ],
      testLabel: 'unsorted entries ',
    },
  ]

  for (const { args, testLabel } of tests) {
    it(testLabel, () => {
      assert.throws(() => getOldEntries.apply(null, args), { code: 'ERR_ASSERTION' })
    })
  }
})
