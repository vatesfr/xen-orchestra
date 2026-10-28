import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vMigrationList } from '@/modules/v2v/composables/use-v2v-migration-list.composable.ts'
import { useV2vVmMapping } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import type { V2vMigrationList, V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { connectV2vSource } from '@/test/connect-v2v-source.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vDisk, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vMigrationList, createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import {
  V2V_DATA_DISK,
  V2V_DEBIAN_TEMPLATE,
  V2V_DEFAULT_NETWORK,
  V2V_DEFAULT_SR,
  V2V_DEFAULT_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_DISK_ROWS,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_MAPPING_INVENTORY,
  V2V_NIC_OVERRIDES,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_TARGET_OPTIONS,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'
import { readV2vMigrationListStorage, seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import type { XoV2vDatastore, XoV2vHost, XoV2vVm } from '@vates/types'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool()

const OTHER_POOL_ID = 'pool-other' as FrontXoPool['id']

const OVERRIDDEN_VM = createV2vMigrationListVm({
  id: V2V_MAPPED_VM.id,
  disks: V2V_DISK_OVERRIDES,
  nics: V2V_NIC_OVERRIDES,
})

const DEFAULT_TAGS = ['migrated-from:vmware']

function createListOf(listVm: V2vMigrationListVm) {
  return createV2vMigrationList({ poolId: POOL.id, vms: [listVm] })
}

// The pool of the list offers the mapping fixtures, another pool one target of each kind
function seedPools() {
  destinationCollectionsMock.pools.value = [POOL]
  destinationCollectionsMock.srs.value = [
    ...V2V_POOL_OFFERS.srs,
    createSr({ id: 'sr-other' as FrontXoSr['id'], $pool: OTHER_POOL_ID }),
  ]
  destinationCollectionsMock.networks.value = [...V2V_POOL_OFFERS.networks, createNetwork({ $pool: OTHER_POOL_ID })]
  destinationCollectionsMock.templates.value = [
    ...V2V_POOL_OFFERS.templates,
    createVmTemplate({ $pool: OTHER_POOL_ID }),
  ]
}

type MountOptions = { listVm?: V2vMigrationListVm; vm?: XoV2vVm; isSourceConnected?: boolean }

function mountVmMapping({ listVm = OVERRIDDEN_VM, vm = V2V_MAPPED_VM, isSourceConnected = true }: MountOptions = {}) {
  const storedList = createListOf(listVm)

  seedPools()
  seedV2vMigrationList(storedList)

  return mountComposableWithI18n(() => {
    if (isSourceConnected) {
      connectV2vSource({ inventory: V2V_MAPPING_INVENTORY })
    }

    const migrationList = useV2vMigrationList(storedList.sourceId, storedList.poolId)

    return {
      ...useV2vVmMapping(vm, {
        list: () => migrationList.list.value as V2vMigrationList,
        updateVm: migrationList.updateVm,
      }),
      getSrOptionLabel: useXoSrUtils().getSrOptionLabel,
    }
  })
}

function readStoredVm(): V2vMigrationListVm {
  return readV2vMigrationListStorage().vms[0]
}

beforeEach(() => {
  destinationCollectionsMock.reset()
})

describe('options', () => {
  it('offers the writable SRs of the list pool, labelled with their location and free space', () => {
    const mapping = mountVmMapping()

    expect(mapping.srOptions).toEqual(
      V2V_POOL_OFFERS.srs.map(sr => ({ id: sr.id, label: mapping.getSrOptionLabel(sr) }))
    )
  })

  it('offers the networks and the templates of the list pool, by name', () => {
    const mapping = mountVmMapping()

    expect([mapping.networkOptions, mapping.templateOptions]).toEqual([
      V2V_TARGET_OPTIONS.networks,
      V2V_TARGET_OPTIONS.templates,
    ])
  })
})

describe('areOffersReady', () => {
  it('is true once the SRs, the networks and the templates are loaded', () => {
    expect(mountVmMapping().areOffersReady).toBe(true)
  })

  it.each(['areSrsReady', 'areNetworksReady', 'areTemplatesReady'] as const)(
    'is false while %s is false',
    readyFlag => {
      destinationCollectionsMock[readyFlag].value = false

      expect(mountVmMapping().areOffersReady).toBe(false)
    }
  )
})

describe('poolName', () => {
  it('names the pool of the list', () => {
    expect(mountVmMapping().poolName).toBe(POOL.name_label)
  })
})

describe('hostName', () => {
  it('names the source host of the VM', () => {
    expect(mountVmMapping().hostName).toBe('esx01.lab.local')
  })

  it('is undefined for a host missing from the inventory', () => {
    const vm = createV2vVm({ id: V2V_MAPPED_VM.id, hostId: 'host-unknown' as XoV2vHost['id'] })

    expect(mountVmMapping({ vm }).hostName).toBeUndefined()
  })
})

describe('without connected source', () => {
  it('names no host and each datastore by its id', () => {
    const mapping = mountVmMapping({ isSourceConnected: false })

    expect([mapping.hostName, mapping.diskRows.map(row => row.datastore)]).toEqual([
      undefined,
      [V2V_SYSTEM_DISK.datastoreId, V2V_DATA_DISK.datastoreId],
    ])
  })
})

describe('checks', () => {
  it('labels the checks of the source VM', () => {
    const vm = createV2vVm({ id: V2V_MAPPED_VM.id, snapshotCount: 2 })
    const mapping = mountVmMapping({ vm })

    expect(mapping.checks).toEqual([
      { label: mapping.t('v2v:check:no-unsupported-disk'), accent: 'success' },
      { label: mapping.t('v2v:check:n-snapshots', { n: 2 }), accent: 'warning' },
    ])
  })
})

describe('diskRows', () => {
  it('maps each disk to its override, or else to the default SR', () => {
    expect(mountVmMapping().diskRows).toEqual(V2V_DISK_ROWS)
  })

  it('names a datastore missing from the inventory by its id', () => {
    const datastoreId = 'datastore-unknown' as XoV2vDatastore['id']
    const vm = createV2vVm({ id: V2V_MAPPED_VM.id, disks: [createV2vDisk({ datastoreId })] })

    expect(mountVmMapping({ vm }).diskRows.map(row => row.datastore)).toEqual([datastoreId])
  })

  it('maps every disk of a VM missing from the list to the default SR', () => {
    const listVm = createV2vMigrationListVm({ id: 'vm-other' as XoV2vVm['id'], disks: V2V_DISK_OVERRIDES })

    expect(mountVmMapping({ listVm }).diskRows.map(row => row.sr.origin)).toEqual(['default', 'default'])
  })
})

describe('nicRows', () => {
  it('maps each NIC to its override, or else to the default network, with its port group', () => {
    expect(mountVmMapping().nicRows).toEqual(V2V_NIC_ROWS)
  })
})

describe('template', () => {
  it('maps the VM to the default template without override', () => {
    expect(mountVmMapping().template).toEqual({ value: V2V_DEFAULT_TEMPLATE.id, origin: 'default', isOffered: true })
  })
})

const CLEARING_TARGETS = [
  ['its default', 'default'],
  ['undefined, a reset', 'reset'],
] as const

describe('setDiskSr', () => {
  it('overrides the SR of a disk, keeping the other overrides', () => {
    const mapping = mountVmMapping()

    mapping.setDiskSr(V2V_SYSTEM_DISK.key, V2V_SSD_SR.id)

    expect(mapping.diskRows.map(row => row.sr)).toEqual([
      { value: V2V_SSD_SR.id, origin: 'overridden', isOffered: true },
      { value: V2V_SSD_SR.id, origin: 'overridden', isOffered: true },
    ])
    expect(readStoredVm().disks).toEqual({ [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id, [V2V_DATA_DISK.key]: V2V_SSD_SR.id })
  })

  it.each(CLEARING_TARGETS)('clears the override of a disk set to %s', (_, clearing) => {
    const mapping = mountVmMapping()

    mapping.setDiskSr(V2V_DATA_DISK.key, clearing === 'default' ? V2V_DEFAULT_SR.id : undefined)

    expect(mapping.diskRows[1].sr).toEqual({ value: V2V_DEFAULT_SR.id, origin: 'default', isOffered: true })
    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id, nics: V2V_NIC_OVERRIDES })
  })
})

describe('setNicNetwork', () => {
  it('overrides the network of a NIC, keeping the other overrides', () => {
    const mapping = mountVmMapping()

    mapping.setNicNetwork(V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id)

    expect(mapping.nicRows[0].network).toEqual({ value: V2V_VLAN_NETWORK.id, origin: 'overridden', isOffered: true })
    expect(readStoredVm().nics).toEqual({
      [V2V_LAN_NIC.key]: V2V_VLAN_NETWORK.id,
      [V2V_VLAN_NIC.key]: V2V_VLAN_NETWORK.id,
    })
  })

  it.each(CLEARING_TARGETS)('clears the override of a NIC set to %s', (_, clearing) => {
    const mapping = mountVmMapping()

    mapping.setNicNetwork(V2V_VLAN_NIC.key, clearing === 'default' ? V2V_DEFAULT_NETWORK.id : undefined)

    expect(mapping.nicRows[1].network).toEqual({ value: V2V_DEFAULT_NETWORK.id, origin: 'default', isOffered: true })
    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id, disks: V2V_DISK_OVERRIDES })
  })
})

describe('setTemplate', () => {
  it('overrides the template', () => {
    const mapping = mountVmMapping()

    mapping.setTemplate(V2V_DEBIAN_TEMPLATE.id)

    expect(mapping.template).toEqual({ value: V2V_DEBIAN_TEMPLATE.id, origin: 'overridden', isOffered: true })
    expect(readStoredVm().template).toBe(V2V_DEBIAN_TEMPLATE.id)
  })

  it.each(CLEARING_TARGETS)('clears the template override set to %s', (_, clearing) => {
    const mapping = mountVmMapping({
      listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, template: V2V_DEBIAN_TEMPLATE.id }),
    })

    mapping.setTemplate(clearing === 'default' ? V2V_DEFAULT_TEMPLATE.id : undefined)

    expect(mapping.template.origin).toBe('default')
    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id })
  })
})

describe('keepMac', () => {
  it('keeps the MAC addresses by default', () => {
    expect(mountVmMapping().keepMac).toBe(true)
  })

  it('reads the stored choice', () => {
    expect(mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, keepMac: false }) }).keepMac).toBe(
      false
    )
  })
})

describe('setKeepMac', () => {
  it('stores the choice not to keep the MAC addresses', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id }) })

    mapping.setKeepMac(false)

    expect(mapping.keepMac).toBe(false)
    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id, keepMac: false })
  })

  it('stores nothing once the MAC addresses are kept again', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, keepMac: false }) })

    mapping.setKeepMac(true)

    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id })
  })
})

describe('tags', () => {
  it('tags the VM as migrated from VMware by default', () => {
    expect(mountVmMapping().tags).toEqual(DEFAULT_TAGS)
  })

  it('reads the stored tags', () => {
    expect(mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, tags: ['web'] }) }).tags).toEqual([
      'web',
    ])
  })
})

describe('setTags', () => {
  it('stores the tags', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id }) })

    mapping.setTags([...DEFAULT_TAGS, 'web'])

    expect(mapping.tags).toEqual([...DEFAULT_TAGS, 'web'])
    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id, tags: [...DEFAULT_TAGS, 'web'] })
  })

  it('stores nothing once the tags are the default ones again', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, tags: ['web'] }) })

    mapping.setTags([...DEFAULT_TAGS])

    expect(readStoredVm()).toEqual({ id: V2V_MAPPED_VM.id })
  })
})
