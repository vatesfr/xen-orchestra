import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  moRef,
  objectSpec,
  orderedChildren,
  propertyFilterSpec,
  propertySpec,
  retrieveOptions,
  traversalSpec,
} from './specs.mjs'

describe('moRef', function () {
  it('carries the type of the object', function () {
    assert.deepEqual(moRef('VirtualMachine', 'vm-42'), { attributes: { type: 'VirtualMachine' }, $value: 'vm-42' })
  })
})

describe('orderedChildren', function () {
  const ORDER = Object.freeze(['first', 'second', 'third'])

  it('emits the keys in schema order, whatever the order they are given in', function () {
    const node = orderedChildren(ORDER, 'SomeType', { third: 3, first: 1 })

    // the insertion order of the keys is what the library turns into element order
    assert.deepEqual(Object.keys(node), ['attributes', 'first', 'third'])
    assert.deepEqual(node, { attributes: { 'xsi:type': 'SomeType' }, first: 1, third: 3 })
  })

  it('skips the values which are not set', function () {
    assert.deepEqual(orderedChildren(ORDER, undefined, { first: undefined, second: null, third: 0 }), { third: 0 })
  })

  it('refuses an unknown element', function () {
    assert.throws(() => orderedChildren(ORDER, 'SomeType', { frist: 1 }), {
      code: 'BAD_VIM25_SPEC',
      message: 'unknown element(s) for this type: frist',
    })
  })

  it('ignores an unknown element which is not set', function () {
    assert.deepEqual(orderedChildren(ORDER, undefined, { frist: undefined }), {})
  })

  it('omits the type when there is none to declare', function () {
    assert.deepEqual(Object.keys(orderedChildren(ORDER, undefined, { first: 1 })), ['first'])
  })
})

describe('property collector specs', function () {
  it('builds a PropertySpec', function () {
    assert.deepEqual(propertySpec({ pathSet: ['config'], type: 'VirtualMachine' }), {
      attributes: { 'xsi:type': 'PropertySpec' },
      type: 'VirtualMachine',
      pathSet: ['config'],
    })
  })

  it('builds an ObjectSpec', function () {
    const spec = objectSpec({ skip: false, obj: moRef('Task', 'task-1') })

    assert.deepEqual(Object.keys(spec), ['attributes', 'obj', 'skip'])
    assert.equal(spec.skip, false)
  })

  it('builds a TraversalSpec', function () {
    assert.deepEqual(Object.keys(traversalSpec({ path: 'view', name: 'traverseEntities', type: 'ContainerView' })), [
      'attributes',
      'name',
      'type',
      'path',
    ])
  })

  it('builds a PropertyFilterSpec', function () {
    assert.deepEqual(
      Object.keys(propertyFilterSpec({ objectSet: [objectSpec({ obj: moRef('Task', 'task-1') })], propSet: [] })),
      ['attributes', 'propSet', 'objectSet']
    )
  })

  it('builds RetrieveOptions', function () {
    assert.deepEqual(retrieveOptions({ maxObjects: 100 }), {
      attributes: { 'xsi:type': 'RetrieveOptions' },
      maxObjects: 100,
    })
  })
})
