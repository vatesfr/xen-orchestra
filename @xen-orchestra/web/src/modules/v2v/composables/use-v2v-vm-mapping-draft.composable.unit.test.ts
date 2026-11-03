import { useV2vVmMappingDraft } from '@/modules/v2v/composables/use-v2v-vm-mapping-draft.composable.ts'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { createV2vMigrationListVm } from '@/test/create-v2v-migration-list.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import {
  mountV2vVmMapping,
  readV2vStoredListVm,
  V2V_OVERRIDDEN_LIST_VM,
  type MountV2vVmMappingOptions,
} from '@/test/mount-v2v-vm-mapping.ts'
import {
  V2V_DATA_DISK,
  V2V_DEBIAN_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_DISK_ROWS,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_MIGRATED_VM_TAGS,
  V2V_NIC_ROWS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_VLAN_NETWORK,
  V2V_VLAN_NIC,
} from '@/test/v2v-mapping-fixtures.ts'
import type { XoV2vVm } from '@vates/types'
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

const FULLY_OVERRIDDEN_VM: V2vMigrationListVm = {
  ...V2V_OVERRIDDEN_LIST_VM,
  template: V2V_DEBIAN_TEMPLATE.id,
  keepMac: false,
  tags: ['web'],
}

function mountVmMappingDraft(options?: MountV2vVmMappingOptions) {
  return mountV2vVmMapping(
    (migrationList, list) => ({
      ...useV2vVmMappingDraft(V2V_MAPPED_VM, { list }),
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
    const draft = mountVmMappingDraft({ listVm: FULLY_OVERRIDDEN_VM })

    expect([draft.diskRows, draft.nicRows, draft.template, draft.keepMac, draft.tags]).toEqual([
      V2V_DISK_ROWS,
      V2V_NIC_ROWS,
      { value: V2V_DEBIAN_TEMPLATE.id, origin: 'overridden', isOffered: true },
      false,
      ['web'],
    ])
  })

  it('starts on the defaults for a VM missing from the list', () => {
    const listVm = createV2vMigrationListVm({ id: 'vm-other' as XoV2vVm['id'], disks: V2V_DISK_OVERRIDES })
    const draft = mountVmMappingDraft({ listVm })

    expect([draft.diskRows.map(row => row.sr.origin), draft.toOverrides()]).toEqual([['default', 'default'], {}])
  })

  it('keeps its overrides once the stored VM changes', async () => {
    const draft = mountVmMappingDraft()

    draft.updateStoredVm(V2V_MAPPED_VM.id, storedVm => ({ ...storedVm, template: V2V_DEBIAN_TEMPLATE.id }))
    await nextTick()

    expect(draft.template.origin).toBe('default')
  })
})

describe('setters', () => {
  it('override a target of the draft, on top of its previous changes', () => {
    const draft = mountVmMappingDraft()

    draft.setDiskSr(V2V_SYSTEM_DISK.key, V2V_SSD_SR.id)
    draft.setNicNetwork(V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id)

    expect([draft.diskRows[0].sr, draft.nicRows[0].network]).toEqual([
      { value: V2V_SSD_SR.id, origin: 'overridden', isOffered: true },
      { value: V2V_VLAN_NETWORK.id, origin: 'overridden', isOffered: true },
    ])
  })

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
    const draft = mountVmMappingDraft({ listVm: FULLY_OVERRIDDEN_VM })

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
      disks: V2V_DISK_OVERRIDES,
      nics: V2V_OVERRIDDEN_LIST_VM.nics,
      keepMac: false,
      tags: ['web'],
    })
  })

  it('leaves out keepMac and the tags set back to their default', () => {
    const draft = mountVmMappingDraft({ listVm: FULLY_OVERRIDDEN_VM })

    draft.setKeepMac(true)
    draft.setTags([...V2V_MIGRATED_VM_TAGS])

    expect(draft.toOverrides()).toStrictEqual({
      disks: V2V_DISK_OVERRIDES,
      nics: V2V_OVERRIDDEN_LIST_VM.nics,
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
