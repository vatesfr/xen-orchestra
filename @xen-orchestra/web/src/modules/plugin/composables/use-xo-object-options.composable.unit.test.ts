import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoObjectOptions } from '@/modules/plugin/composables/use-xo-object-options.composable.ts'
import type { XoObjectType } from '@/modules/plugin/utils/json-schema.util.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { toValue } from 'vue'

const { collections, mockCollection } = await vi.hoisted(async () => {
  const { ref } = await import('vue')

  function createCollection() {
    return { objects: ref<unknown[]>([]), isReady: ref(true), hasError: ref(false), isEnabled: undefined as unknown }
  }

  const collections = {
    host: createCollection(),
    pool: createCollection(),
    sr: createCollection(),
    vm: createCollection(),
  }

  // Each collection names its refs after its objects, e.g. `vms`, `areVmsReady`, `hasVmFetchError`
  function mockCollection(name: keyof typeof collections, [objectsKey, isReadyKey, hasErrorKey]: string[]) {
    return ({ isEnabled }: { isEnabled: unknown }) => {
      const collection = collections[name]
      collection.isEnabled = isEnabled

      return { [objectsKey]: collection.objects, [isReadyKey]: collection.isReady, [hasErrorKey]: collection.hasError }
    }
  }

  return { collections, mockCollection }
})

type CollectionName = keyof typeof collections

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: mockCollection('host', [
    'hosts',
    'areHostsReady',
    'hasHostFetchError',
  ]) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: mockCollection('pool', [
    'pools',
    'arePoolsReady',
    'hasPoolFetchError',
  ]) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: mockCollection('sr', [
    'srs',
    'areSrsReady',
    'hasSrFetchError',
  ]) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: mockCollection('vm', [
    'vms',
    'areVmsReady',
    'hasVmFetchError',
  ]) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  Object.values(collections).forEach(collection => {
    collection.objects.value = []
    collection.isReady.value = true
    collection.hasError.value = false
    collection.isEnabled = undefined
  })
})

function mountOptions(type: XoObjectType | undefined) {
  return mountComposable(() => useXoObjectOptions(type)).wrapper.vm
}

function findEnabledCollections() {
  return (Object.keys(collections) as CollectionName[]).filter(name => toValue(collections[name].isEnabled) === true)
}

describe('options', () => {
  it('lists the objects of the referenced type by name', () => {
    collections.vm.objects.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' })]
    collections.sr.objects.value = [createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Local storage' })]

    expect(mountOptions('vm').options).toEqual([{ value: 'vm-1', label: 'Web server' }])
  })

  it('lists the tags of every object, once and sorted', () => {
    collections.vm.objects.value = [createVm({ tags: ['web', 'prod'] })]
    collections.host.objects.value = [createHost({ tags: ['prod', 'backup'] })]

    expect(mountOptions('tag').options).toEqual([
      { value: 'backup', label: 'backup' },
      { value: 'prod', label: 'prod' },
      { value: 'web', label: 'web' },
    ])
  })

  it('is empty without type', () => {
    collections.vm.objects.value = [createVm()]

    expect(mountOptions(undefined).options).toEqual([])
  })
})

describe('collections', () => {
  it.each([
    { type: 'host', enabled: ['host'] },
    { type: 'pool', enabled: ['pool'] },
    { type: 'sr', enabled: ['sr'] },
    { type: 'vm', enabled: ['vm'] },
    { type: 'tag', enabled: ['host', 'pool', 'sr', 'vm'] },
    { type: undefined, enabled: [] },
  ] as const)('loads the $enabled collections for the $type type', ({ type, enabled }) => {
    mountOptions(type)

    expect(findEnabledCollections()).toEqual(enabled)
  })
})

describe('isReady', () => {
  it('waits for the collection of the referenced type only', () => {
    collections.sr.isReady.value = false

    expect(mountOptions('vm').isReady).toBe(true)
    expect(mountOptions('sr').isReady).toBe(false)
  })

  it('waits for every collection for the tags', () => {
    collections.pool.isReady.value = false

    expect(mountOptions('tag').isReady).toBe(false)
  })

  it('is ready without type', () => {
    collections.vm.isReady.value = false

    expect(mountOptions(undefined).isReady).toBe(true)
  })
})

describe('hasError', () => {
  it('reports the error of the collection of the referenced type only', () => {
    collections.sr.hasError.value = true

    expect(mountOptions('vm').hasError).toBe(false)
    expect(mountOptions('sr').hasError).toBe(true)
  })

  it('reports the error of any collection for the tags', () => {
    collections.host.hasError.value = true

    expect(mountOptions('tag').hasError).toBe(true)
  })

  it('has no error without type', () => {
    collections.vm.hasError.value = true

    expect(mountOptions(undefined).hasError).toBe(false)
  })
})
