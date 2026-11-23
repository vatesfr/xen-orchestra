import * as assert from 'node:assert'
import { test, suite } from 'node:test'
import { LifeCycleStates, loadXapiClasses } from '../src/xapi.mjs'

function field(name, type, state, properties = {}) {
  return {
    name,
    description: 'desc',
    type,
    qualifier: 'RO/runtime',
    tag: '',
    lifecycle: { state },
    ...properties,
  }
}

function xapiClass(name, fields, state, properties = {}) {
  return {
    name,
    description: 'DESC',
    fields,
    messages: [],
    enums: [],
    lifecycle: { state },
    tag: '',
    ...properties,
  }
}

suite('xapi JSON transformation tests', function () {
  test('loadXapiClasses can do a simple parsing', function () {
    const input = [
      xapiClass(
        'cls1',
        [field('str1', 'string', LifeCycleStates.Published, { default: 'lol' })],
        LifeCycleStates.Published
      ),
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
        messages: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })

  test('loadXapiClasses cleans up the Json', function () {
    const input = [
      xapiClass(
        'cls1',
        [
          field('uuid', 'string', LifeCycleStates.Published, {
            description: 'Unique identifier/object reference',
          }),
          field('uuid', 'string', LifeCycleStates.Deprecated, {
            description: 'Unique identifier/object reference',
          }),
        ],
        LifeCycleStates.Published
      ),
      xapiClass('clsdeprecated', [], LifeCycleStates.Deprecated, { default: 'loldeprecated' }),
      xapiClass('clsignored', [], LifeCycleStates.Published, { default: 'lolignored' }),
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
        messages: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })

  test('loadXapiClasses removes published fields pointing to filtered out classes', function () {
    const input = [
      xapiClass(
        'cls1',
        [
          field('ref1', 'clsdeprecated ref', LifeCycleStates.Published, {
            description: 'Unique identifier/object reference',
          }),
        ],
        LifeCycleStates.Published
      ),
      xapiClass('clsdeprecated', [], LifeCycleStates.Deprecated),
    ]
    const expected = {
      cls1: {
        name: 'cls1',
        description: 'DESC',
        fields: {},
        enums: [],
        messages: [],
      },
    }
    const result = loadXapiClasses(new Set([LifeCycleStates.Published]), c => c.name !== 'clsignored', input)
    assert.deepEqual(result, expected)
  })
})
