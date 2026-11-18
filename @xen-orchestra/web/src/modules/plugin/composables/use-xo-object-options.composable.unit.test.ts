import { useXoObjectOptions } from '@/modules/plugin/composables/use-xo-object-options.composable.ts'
import type { XoObjectType } from '@/modules/plugin/utils/json-schema.util.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { toValue } from 'vue'

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

function mountOptions(type: XoObjectType | undefined) {
  return mountComposable(() => useXoObjectOptions(type)).wrapper.vm
}

function findEnabledCollections() {
  const { host, pool, sr } = xoCollectionsMock.isEnabled
  const isEnabled = { host, pool, sr, vm: vmCollectionMock.isEnabled }

  return (Object.keys(isEnabled) as (keyof typeof isEnabled)[]).filter(name => toValue(isEnabled[name]) === true)
}

describe('options', () => {
  it('lists the objects of the referenced type by name', () => {
    vmCollectionMock.vms.value = [createVm({ id: 'vm-1' as FrontXoVm['id'], name_label: 'Web server' })]
    xoCollectionsMock.srs.value = [createSr({ id: 'sr-1' as FrontXoSr['id'], name_label: 'Local storage' })]

    expect(mountOptions('vm').options).toEqual([{ value: 'vm-1', label: 'Web server' }])
  })

  it('lists the tags of every object, once and sorted', () => {
    vmCollectionMock.vms.value = [createVm({ tags: ['web', 'prod'] })]
    xoCollectionsMock.hosts.value = [createHost({ tags: ['prod', 'backup'] })]

    expect(mountOptions('tag').options).toEqual([
      { value: 'backup', label: 'backup' },
      { value: 'prod', label: 'prod' },
      { value: 'web', label: 'web' },
    ])
  })

  it('is empty without type', () => {
    vmCollectionMock.vms.value = [createVm()]

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
    xoCollectionsMock.areSrsReady.value = false

    expect(mountOptions('vm').isReady).toBe(true)
    expect(mountOptions('sr').isReady).toBe(false)
  })

  it('waits for every collection for the tags', () => {
    xoCollectionsMock.arePoolsReady.value = false

    expect(mountOptions('tag').isReady).toBe(false)
  })

  it('is ready without type', () => {
    vmCollectionMock.areVmsReady.value = false

    expect(mountOptions(undefined).isReady).toBe(true)
  })
})

describe('hasError', () => {
  it('reports the error of the collection of the referenced type only', () => {
    xoCollectionsMock.hasSrFetchError.value = true

    expect(mountOptions('vm').hasError).toBe(false)
    expect(mountOptions('sr').hasError).toBe(true)
  })

  it('reports the error of any collection for the tags', () => {
    xoCollectionsMock.hasHostFetchError.value = true

    expect(mountOptions('tag').hasError).toBe(true)
  })

  it('has no error without type', () => {
    vmCollectionMock.hasVmFetchError.value = true

    expect(mountOptions(undefined).hasError).toBe(false)
  })
})
