import assert from 'assert/strict'
import forEach from 'lodash/forEach.js'
import tap from 'tap'
import { resolveParamsVector } from './execute-call.mjs'

const { describe, it } = tap.mocha

describe('resolveParamsVector', function () {
  forEach(
    {
      'cross product with three sets': [
        // Expected result.
        [
          { id: 3, value: 'foo', remote: 'local' },
          { id: 7, value: 'foo', remote: 'local' },
          { id: 10, value: 'foo', remote: 'local' },
          { id: 3, value: 'bar', remote: 'local' },
          { id: 7, value: 'bar', remote: 'local' },
          { id: 10, value: 'bar', remote: 'local' },
        ],
        // Entry.
        {
          type: 'crossProduct',
          items: [
            {
              type: 'set',
              values: [{ id: 3 }, { id: 7 }, { id: 10 }],
            },
            {
              type: 'set',
              values: [{ value: 'foo' }, { value: 'bar' }],
            },
            {
              type: 'set',
              values: [{ remote: 'local' }],
            },
          ],
        },
      ],
      'cross product with `set` and `map`': [
        // Expected result.
        [
          { remote: 'local', id: 'vm:2' },
          { remote: 'smb', id: 'vm:2' },
        ],

        // Entry.
        {
          type: 'crossProduct',
          items: [
            {
              type: 'set',
              values: [{ remote: 'local' }, { remote: 'smb' }],
            },
            {
              type: 'map',
              collection: {
                type: 'fetchObjects',
                pattern: {
                  $pool: { __or: ['pool:1', 'pool:8', 'pool:12'] },
                  power_state: 'Running',
                  tags: ['foo'],
                  type: 'VM',
                },
              },
              iteratee: {
                type: 'extractProperties',
                mapping: { id: 'id' },
              },
            },
          ],
        },

        // Context.
        {
          getObjects: function () {
            return [
              {
                id: 'vm:1',
                $pool: 'pool:1',
                tags: [],
                type: 'VM',
                power_state: 'Halted',
              },
              {
                id: 'vm:2',
                $pool: 'pool:1',
                tags: ['foo'],
                type: 'VM',
                power_state: 'Running',
              },
              {
                id: 'host:1',
                type: 'host',
                power_state: 'Running',
              },
              {
                id: 'vm:3',
                $pool: 'pool:8',
                tags: ['foo'],
                type: 'VM',
                power_state: 'Halted',
              },
            ]
          },
        },
      ],
    },
    ([expectedResult, entry, context], name) => {
      describe(`with ${name}`, () => {
        it('Resolves params vector', () => {
          assert.deepEqual(resolveParamsVector.call(context, entry), expectedResult)
        })
      })
    }
  )
})
