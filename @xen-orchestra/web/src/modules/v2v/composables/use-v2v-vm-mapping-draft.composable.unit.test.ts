import { useV2vVmMappingDraft } from '@/modules/v2v/composables/use-v2v-vm-mapping-draft.composable.ts'
import { createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  mountV2vVmMapping,
  readV2vStoredListVm,
  V2V_OVERRIDDEN_LIST_VM,
  type MountV2vVmMappingOptions,
  V2V_OTHER_LIST_VM,
  V2V_FULLY_OVERRIDDEN_LIST_VM,
  V2V_LIST_VM_OVERRIDES,
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
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
  createV2vOfferedTarget,
} from '@/test/v2v-mapping-fixtures.ts'
import { nextTick } from 'vue'

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

function mountVmMappingDraft(options?: MountV2vVmMappingOptions) {
  return mountV2vVmMapping(
    (migrationList, list, inventory) => ({
      ...useV2vVmMappingDraft(V2V_MAPPED_VM, { list, inventory }),
      updateStoredVm: migrationList.updateVm,
    }),
    options
  )
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('draft', () => {
  it('starts from the stored overrides of the VM', () => {
    const draft = mountVmMappingDraft({ listVm: V2V_FULLY_OVERRIDDEN_LIST_VM })

    expect([draft.diskRows, draft.nicRows, draft.template, draft.keepMac, draft.tags]).toEqual([
      V2V_DISK_ROWS,
      V2V_NIC_ROWS,
      createV2vOfferedTarget(V2V_DEBIAN_TEMPLATE.id, 'overridden'),
      false,
      ['web'],
    ])
  })

  it('starts on the defaults for a VM missing from the list', () => {
    const draft = mountVmMappingDraft({ listVm: V2V_OTHER_LIST_VM })

    expect([draft.diskRows.map(row => row.sr.origin), draft.toOverrides()]).toEqual([['default', 'default'], {}])
  })

  it('keeps its overrides once the stored VM changes', async () => {
    const draft = mountVmMappingDraft()

    draft.updateStoredVm(V2V_MAPPED_VM.id, storedVm => ({ ...storedVm, template: V2V_DEBIAN_TEMPLATE.id }))
    await nextTick()

    expect(draft.template.origin).toBe('default')
  })
})

describe('setDiskSr', () => {
  it('overrides the SR of a disk, keeping the other overrides', () => {
    const draft = mountVmMappingDraft()

    draft.setDiskSr(V2V_SYSTEM_DISK.key, V2V_SSD_SR.id)

    expect(draft.diskRows.map(row => row.sr)).toEqual([
      createV2vOfferedTarget(V2V_SSD_SR.id, 'overridden'),
      createV2vOfferedTarget(V2V_SSD_SR.id, 'overridden'),
    ])
    expect(draft.toOverrides().disks).toEqual({
      [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id,
      [V2V_DATA_DISK.key]: V2V_SSD_SR.id,
    })
  })
})

describe('setNicNetwork', () => {
  it('overrides the network of a NIC, keeping the other overrides', () => {
    const draft = mountVmMappingDraft()

    draft.setNicNetwork(V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id)

    expect(draft.nicRows[0].network).toEqual(createV2vOfferedTarget(V2V_VLAN_NETWORK.id, 'overridden'))
    expect(draft.toOverrides().nics).toEqual({
      [V2V_LAN_NIC.key]: V2V_VLAN_NETWORK.id,
      [V2V_VLAN_NIC.key]: V2V_VLAN_NETWORK.id,
    })
  })
})

describe('setTemplate', () => {
  it('overrides the template', () => {
    const draft = mountVmMappingDraft()

    draft.setTemplate(V2V_DEBIAN_TEMPLATE.id)

    expect(draft.template).toEqual(createV2vOfferedTarget(V2V_DEBIAN_TEMPLATE.id, 'overridden'))
    expect(draft.toOverrides().template).toBe(V2V_DEBIAN_TEMPLATE.id)
  })
})

type VmMappingDraft = ReturnType<typeof mountVmMappingDraft>

const CLEARABLE_OVERRIDES = [
  {
    target: 'a disk',
    setDefault: (draft: VmMappingDraft) => draft.setDiskSr(V2V_DATA_DISK.key, V2V_DEFAULT_SR.id),
    reset: (draft: VmMappingDraft) => draft.setDiskSr(V2V_DATA_DISK.key, undefined),
    read: (draft: VmMappingDraft) => draft.diskRows[1].sr,
    defaultTarget: createV2vOfferedTarget(V2V_DEFAULT_SR.id),
    otherOverrides: { nics: V2V_NIC_OVERRIDES },
  },
  {
    target: 'a NIC',
    setDefault: (draft: VmMappingDraft) => draft.setNicNetwork(V2V_VLAN_NIC.key, V2V_DEFAULT_NETWORK.id),
    reset: (draft: VmMappingDraft) => draft.setNicNetwork(V2V_VLAN_NIC.key, undefined),
    read: (draft: VmMappingDraft) => draft.nicRows[1].network,
    defaultTarget: createV2vOfferedTarget(V2V_DEFAULT_NETWORK.id),
    otherOverrides: { disks: V2V_DISK_OVERRIDES },
  },
  {
    target: 'the template',
    listVm: createV2vMigrationListVm({ id: V2V_MAPPED_VM.id, template: V2V_DEBIAN_TEMPLATE.id }),
    setDefault: (draft: VmMappingDraft) => draft.setTemplate(V2V_DEFAULT_TEMPLATE.id),
    reset: (draft: VmMappingDraft) => draft.setTemplate(undefined),
    read: (draft: VmMappingDraft) => draft.template,
    defaultTarget: createV2vOfferedTarget(V2V_DEFAULT_TEMPLATE.id),
    otherOverrides: {},
  },
]

describe.each(CLEARABLE_OVERRIDES)(
  'the override of $target',
  ({ listVm, read, defaultTarget, otherOverrides, ...clear }) => {
    it.each([
      ['its default', 'setDefault'],
      ['undefined, a reset', 'reset'],
    ] as const)('is cleared once set to %s, keeping the other overrides', (_, clearing) => {
      const draft = mountVmMappingDraft({ listVm })

      clear[clearing](draft)

      expect(read(draft)).toEqual(defaultTarget)
      expect(draft.toOverrides()).toStrictEqual(otherOverrides)
    })
  }
)

describe('setters', () => {
  it('write nothing to the stored list', () => {
    const draft = mountVmMappingDraft()

    draft.setDiskSr(V2V_SYSTEM_DISK.key, V2V_SSD_SR.id)
    draft.setNicNetwork(V2V_VLAN_NIC.key, undefined)
    draft.setTemplate(V2V_DEBIAN_TEMPLATE.id)
    draft.setKeepMac(false)
    draft.setTags(['web'])

    expect(readV2vStoredListVm()).toEqual(V2V_OVERRIDDEN_LIST_VM)
  })
})

describe('toOverrides', () => {
  it('returns the changed overrides, leaving out the cleared ones and keeping the untouched ones', () => {
    const draft = mountVmMappingDraft({ listVm: V2V_FULLY_OVERRIDDEN_LIST_VM })

    draft.setDiskSr(V2V_SYSTEM_DISK.key, V2V_SSD_SR.id)
    draft.setNicNetwork(V2V_VLAN_NIC.key, undefined)

    expect(draft.toOverrides()).toStrictEqual({
      disks: { [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id, [V2V_DATA_DISK.key]: V2V_SSD_SR.id },
      template: V2V_DEBIAN_TEMPLATE.id,
      keepMac: false,
      tags: ['web'],
    })
  })

  it('returns keepMac and the tags once set on the draft', () => {
    const draft = mountVmMappingDraft()

    draft.setKeepMac(false)
    draft.setTags(['web'])

    expect([draft.keepMac, draft.tags]).toEqual([false, ['web']])
    expect(draft.toOverrides()).toStrictEqual({
      ...V2V_LIST_VM_OVERRIDES,
      keepMac: false,
      tags: ['web'],
    })
  })

  it('leaves out keepMac and the tags set back to their default', () => {
    const draft = mountVmMappingDraft({ listVm: V2V_FULLY_OVERRIDDEN_LIST_VM })

    draft.setKeepMac(true)
    draft.setTags([...V2V_MIGRATED_VM_TAGS])

    expect(draft.toOverrides()).toStrictEqual({
      ...V2V_LIST_VM_OVERRIDES,
      template: V2V_DEBIAN_TEMPLATE.id,
    })
  })
})

describe('areOffersReady', () => {
  it('is false while the offers load', () => {
    xoCollectionsMock.areSrsReady.value = false

    expect(mountVmMappingDraft().areOffersReady).toBe(false)
  })
})
