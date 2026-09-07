import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  diskBacking,
  moRef,
  objectSpec,
  orderedChildren,
  propertyFilterSpec,
  propertySpec,
  retrieveOptions,
  traversalSpec,
  VIRTUAL_DEVICE_CONFIG_SPEC,
  virtualDisk,
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

describe('device specs', function () {
  it('builds a VirtualDisk in schema order', function () {
    const disk = virtualDisk({
      capacityInKB: 1024,
      unitNumber: 1,
      key: -1,
      controllerKey: 1000,
      backing: diskBacking('VirtualDiskFlatVer2BackingInfo', {
        diskMode: 'independent_nonpersistent',
        fileName: '[ds] vm/vm-000001.vmdk',
      }),
    })

    assert.deepEqual(Object.keys(disk), ['attributes', 'key', 'backing', 'controllerKey', 'unitNumber', 'capacityInKB'])
    assert.equal(disk.attributes['xsi:type'], 'VirtualDisk')
    // the backing declares the type the host reported, and `fileName` comes before `diskMode`
    assert.deepEqual(Object.keys(disk.backing), ['attributes', 'fileName', 'diskMode'])
    assert.equal(disk.backing.attributes['xsi:type'], 'VirtualDiskFlatVer2BackingInfo')
  })

  it('supports the backing types of a snapshot chain', function () {
    for (const xsiType of [
      'VirtualDiskFlatVer2BackingInfo',
      'VirtualDiskSeSparseBackingInfo',
      'VirtualDiskSparseVer2BackingInfo',
      'VirtualDiskRawDiskMappingVer1BackingInfo',
    ]) {
      assert.equal(diskBacking(xsiType, { fileName: 'a.vmdk' }).attributes['xsi:type'], xsiType)
    }
  })

  it('refuses an unknown backing type', function () {
    assert.throws(() => diskBacking('VirtualDiskWhateverBackingInfo', {}), {
      message: 'unsupported virtual disk backing type: VirtualDiskWhateverBackingInfo',
    })
  })

  it('keeps fileOperation right after operation in a device change', function () {
    // a detach must not carry a fileOperation, an attach of a new disk must
    assert.deepEqual(VIRTUAL_DEVICE_CONFIG_SPEC.slice(0, 3), ['operation', 'fileOperation', 'device'])
  })
})
