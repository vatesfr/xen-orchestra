import assert from 'assert/strict'
import forEach from 'lodash/forEach.js'
import test from 'node:test'
import { thunkToArray } from './utils.mjs'
import { crossProduct, mergeObjects } from './math.mjs'

const { describe, it } = test

describe('mergeObjects', function () {
  forEach(
    {
      'Two sets of one': [{ a: 1, b: 2 }, { a: 1 }, { b: 2 }],
      'Two sets of two': [
        { a: 1, b: 2, c: 3, d: 4 },
        { a: 1, b: 2 },
        { c: 3, d: 4 },
      ],
      'Three sets': [{ a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }, { a: 1 }, { b: 2, c: 3 }, { d: 4, e: 5, f: 6 }],
      'One set': [
        { a: 1, b: 2 },
        { a: 1, b: 2 },
      ],
      'Empty set': [{ a: 1 }, { a: 1 }, {}],
      'All empty': [{}, {}, {}],
      'No set': [{}],
    },
    ([resultSet, ...sets], name) => {
      describe(`with ${name}`, () => {
        it('Assembles all given param sets in on set', function () {
          assert.deepEqual(mergeObjects(sets), resultSet)
        })
      })
    }
  )
})

describe('crossProduct', function () {
  // Gives the sum of all args
  const addTest = args => args.reduce((prev, curr) => prev + curr, 0)
  // Gives the product of all args
  const multiplyTest = args => args.reduce((prev, curr) => prev * curr, 1)

  forEach(
    {
      '2 sets of 2 items to multiply': [
        [10, 14, 15, 21],
        [
          [2, 3],
          [5, 7],
        ],
        multiplyTest,
      ],
      '3 sets of 2 items to multiply': [
        [110, 130, 154, 182, 165, 195, 231, 273],
        [
          [2, 3],
          [5, 7],
          [11, 13],
        ],
        multiplyTest,
      ],
      '2 sets of 3 items to multiply': [
        [14, 22, 26, 21, 33, 39, 35, 55, 65],
        [
          [2, 3, 5],
          [7, 11, 13],
        ],
        multiplyTest,
      ],
      '2 sets of 2 items to add': [
        [7, 9, 8, 10],
        [
          [2, 3],
          [5, 7],
        ],
        addTest,
      ],
      '3 sets of 2 items to add': [
        [18, 20, 20, 22, 19, 21, 21, 23],
        [
          [2, 3],
          [5, 7],
          [11, 13],
        ],
        addTest,
      ],
      '2 sets of 3 items to add': [
        [9, 13, 15, 10, 14, 16, 12, 16, 18],
        [
          [2, 3, 5],
          [7, 11, 13],
        ],
        addTest,
      ],
    },
    ([product, items, cb], name) => {
      describe(`with ${name}`, () => {
        it('Crosses sets of values with a crossProduct callback', function () {
          assert.deepEqual(thunkToArray(crossProduct(items, cb)).sort(), product.sort())
        })
      })
    }
  )
})
