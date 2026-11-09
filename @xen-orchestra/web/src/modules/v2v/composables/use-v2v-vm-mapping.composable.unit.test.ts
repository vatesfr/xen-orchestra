import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { V2vAccentedLabel } from '@/modules/v2v/composables/use-v2v-vm-labels.composable.ts'
import { useV2vVmMapping, useV2vVmMappingSetters } from '@/modules/v2v/composables/use-v2v-vm-mapping.composable.ts'
import { createV2vDisk, createV2vVm } from '@/test/create-v2v-inventory.ts'
import { createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  mountV2vVmMapping,
  type MountV2vVmMappingOptions,
  readV2vStoredListVm,
  V2V_OTHER_LIST_VM,
} from '@/test/mount-v2v-vm-mapping.ts'
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
  V2V_MIGRATED_VM_TAGS,
  V2V_NIC_OVERRIDES,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_TARGET_OPTIONS,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
  createV2vOfferedTarget,
} from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'
import type { InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import type { XoV2vDatastore, XoV2vHost, XoV2vVm } from '@vates/types'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

type MountOptions = MountV2vVmMappingOptions & {
  vm?: XoV2vVm
  listIssue?: V2vAccentedLabel<InfoAccent>
}

function mountVmMapping({ vm = V2V_MAPPED_VM, listIssue, ...options }: MountOptions = {}) {
  return mountV2vVmMapping(
    (migrationList, list) => ({
      ...useV2vVmMapping(vm, { list, listIssue }),
      ...useV2vVmMappingSetters(vm, { list, updateVm: migrationList.updateVm }),
      getSrSelectLabel: useXoSrUtils().getSrSelectLabel,
    }),
    options
  )
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('options', () => {
  it('offers the writable SRs of the list pool, labelled with their location and free space', () => {
    const mapping = mountVmMapping()

    expect(mapping.srOptions).toEqual(
      V2V_POOL_OFFERS.srs.map(sr => ({ id: sr.id, label: mapping.getSrSelectLabel(sr) }))
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
      xoCollectionsMock[readyFlag].value = false

      expect(mountVmMapping().areOffersReady).toBe(false)
    }
  )
})

describe('poolName', () => {
  it('names the pool of the list', () => {
    expect(mountVmMapping().poolName).toBe(V2V_LIST_POOL.name_label)
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

  it('adds the issue of the VM in the list after the checks of its source', () => {
    const listIssue = { label: 'Import in progress', accent: 'danger' } as const

    expect(mountVmMapping({ listIssue }).checks.at(-1)).toEqual(listIssue)
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
    expect(mountVmMapping({ listVm: V2V_OTHER_LIST_VM }).diskRows.map(row => row.sr.origin)).toEqual([
      'default',
      'default',
    ])
  })
})

describe('nicRows', () => {
  it('maps each NIC to its override, or else to the default network, with its port group', () => {
    expect(mountVmMapping().nicRows).toEqual(V2V_NIC_ROWS)
  })
})

describe('template', () => {
  it('maps the VM to the default template without override', () => {
    expect(mountVmMapping().template).toEqual(createV2vOfferedTarget(V2V_DEFAULT_TEMPLATE.id))
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
      createV2vOfferedTarget(V2V_SSD_SR.id, 'overridden'),
      createV2vOfferedTarget(V2V_SSD_SR.id, 'overridden'),
    ])
    expect(readV2vStoredListVm().disks).toEqual({
      [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id,
      [V2V_DATA_DISK.key]: V2V_SSD_SR.id,
    })
  })

  it.each(CLEARING_TARGETS)('clears the override of a disk set to %s', (_, clearing) => {
    const mapping = mountVmMapping()

    mapping.setDiskSr(V2V_DATA_DISK.key, clearing === 'default' ? V2V_DEFAULT_SR.id : undefined)

    expect(mapping.diskRows[1].sr).toEqual(createV2vOfferedTarget(V2V_DEFAULT_SR.id))
    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id, nics: V2V_NIC_OVERRIDES })
  })
})

describe('setNicNetwork', () => {
  it('overrides the network of a NIC, keeping the other overrides', () => {
    const mapping = mountVmMapping()

    mapping.setNicNetwork(V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id)

    expect(mapping.nicRows[0].network).toEqual(createV2vOfferedTarget(V2V_VLAN_NETWORK.id, 'overridden'))
    expect(readV2vStoredListVm().nics).toEqual({
      [V2V_LAN_NIC.key]: V2V_VLAN_NETWORK.id,
      [V2V_VLAN_NIC.key]: V2V_VLAN_NETWORK.id,
    })
  })

  it.each(CLEARING_TARGETS)('clears the override of a NIC set to %s', (_, clearing) => {
    const mapping = mountVmMapping()

    mapping.setNicNetwork(V2V_VLAN_NIC.key, clearing === 'default' ? V2V_DEFAULT_NETWORK.id : undefined)

    expect(mapping.nicRows[1].network).toEqual(createV2vOfferedTarget(V2V_DEFAULT_NETWORK.id))
    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id, disks: V2V_DISK_OVERRIDES })
  })
})

describe('setTemplate', () => {
  it('overrides the template', () => {
    const mapping = mountVmMapping()

    mapping.setTemplate(V2V_DEBIAN_TEMPLATE.id)

    expect(mapping.template).toEqual(createV2vOfferedTarget(V2V_DEBIAN_TEMPLATE.id, 'overridden'))
    expect(readV2vStoredListVm().template).toBe(V2V_DEBIAN_TEMPLATE.id)
  })

  it.each(CLEARING_TARGETS)('clears the template override set to %s', (_, clearing) => {
    const mapping = mountVmMapping({
      listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, template: V2V_DEBIAN_TEMPLATE.id }),
    })

    mapping.setTemplate(clearing === 'default' ? V2V_DEFAULT_TEMPLATE.id : undefined)

    expect(mapping.template.origin).toBe('default')
    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id })
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
    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id, keepMac: false })
  })

  it('stores nothing once the MAC addresses are kept again', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, keepMac: false }) })

    mapping.setKeepMac(true)

    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id })
  })
})

describe('tags', () => {
  it('tags the VM as migrated from VMware by default', () => {
    expect(mountVmMapping().tags).toEqual(V2V_MIGRATED_VM_TAGS)
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

    mapping.setTags([...V2V_MIGRATED_VM_TAGS, 'web'])

    expect(mapping.tags).toEqual([...V2V_MIGRATED_VM_TAGS, 'web'])
    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id, tags: [...V2V_MIGRATED_VM_TAGS, 'web'] })
  })

  it('stores nothing once the tags are the default ones again', () => {
    const mapping = mountVmMapping({ listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, tags: ['web'] }) })

    mapping.setTags([...V2V_MIGRATED_VM_TAGS])

    expect(readV2vStoredListVm()).toEqual({ id: V2V_MAPPED_VM.id })
  })
})
