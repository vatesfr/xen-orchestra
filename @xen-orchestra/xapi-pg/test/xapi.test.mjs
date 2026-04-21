import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import { LifeCycleStates, loadXapiClasses } from '../src/xapi.mjs'
suite('xapi JSON transformation tests', function () {
  test('loadXapiClasses can do a simple parsing', function () {
    const input = [
      {
        name: 'cls1',
        description: 'DESC',
        fields: [
          {
            name: 'str1',
            description: 'desc',
            type: 'string',
            qualifier: 'RO/runtime',
            tag: '',
            lifecycle: {
              state: 'Published_s',
            },
            default: 'lol',
          },
        ],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Published_s',
        },
        tag: '',
      },
    ]
    const expected = {
      cls1: {
        name: 'cls1',
        description: 'DESC',
        fields: {
          str1: {
            name: 'str1',
            description: 'desc',
            type: 'string',
            default: 'lol',
          },
        },
        enums: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })

  test('loadXapiClasses cleans up the Json', function () {
    const input = [
      {
        name: 'cls1',
        description: 'DESC',
        fields: [
          {
            name: 'uuid',
            description: 'Unique identifier/object reference',
            type: 'string',
            qualifier: 'RO/runtime',
            tag: '',
            lifecycle: {
              state: 'Published_s',
            },
          },
          {
            name: 'uuid',
            description: 'Unique identifier/object reference',
            type: 'string',
            qualifier: 'RO/runtime',
            tag: '',
            lifecycle: {
              state: 'Deprecated_s',
            },
          },
        ],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Published_s',
        },
        tag: '',
      },
      {
        name: 'clsdeprecated',
        description: 'DESC',
        fields: [],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Deprecated_s',
        },
        tag: '',
        default: 'loldeprecated',
      },
      {
        name: 'clsignored',
        description: 'DESC',
        fields: [],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Published_s',
        },
        tag: '',
        default: 'lolignored',
      },
    ]
    const expected = {
      cls1: {
        name: 'cls1',
        description: 'DESC',
        fields: {
          uuid: {
            name: 'uuid',
            description: 'Unique identifier/object reference',
            type: 'string',
            default: undefined,
          },
        },
        enums: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })

  test('loadXapiClasses removes published fields pointing to filtered out classes', function () {
    const input = [
      {
        name: 'cls1',
        description: 'DESC',
        fields: [
          {
            name: 'ref1',
            description: 'Unique identifier/object reference',
            type: 'clsdeprecated ref',
            qualifier: 'RO/runtime',
            tag: '',
            lifecycle: {
              state: 'Published_s',
            },
          },
        ],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Published_s',
        },
        tag: '',
      },
      {
        name: 'clsdeprecated',
        description: 'DESC',
        fields: [],
        messages: [],
        enums: [],
        lifecycle: {
          state: 'Deprecated_s',
        },
        tag: '',
      },
    ]
    const expected = {
      cls1: {
        name: 'cls1',
        description: 'DESC',
        fields: {},
        enums: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })
})
