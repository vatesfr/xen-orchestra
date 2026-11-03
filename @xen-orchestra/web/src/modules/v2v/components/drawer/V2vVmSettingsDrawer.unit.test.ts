import V2vVmSettingsDrawer from '@/modules/v2v/components/drawer/V2vVmSettingsDrawer.vue'
import V2vDiskMappingTable from '@/modules/v2v/components/mapping/V2vDiskMappingTable.vue'
import V2vNicMappingTable from '@/modules/v2v/components/mapping/V2vNicMappingTable.vue'
import V2vVmOptionsFields from '@/modules/v2v/components/mapping/V2vVmOptionsFields.vue'
import type { V2vMigrationListVm } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountV2vVmMappingComponent, V2V_OVERRIDDEN_LIST_VM } from '@/test/mount-v2v-vm-mapping.ts'
import {
  V2V_DATA_DISK,
  V2V_DEBIAN_TEMPLATE,
  V2V_DISK_OVERRIDES,
  V2V_DISK_ROWS,
  V2V_LAN_NIC,
  V2V_MAPPED_VM,
  V2V_NIC_OVERRIDES,
  V2V_NIC_ROWS,
  V2V_POOL_OFFERS,
  V2V_SSD_SR,
  V2V_SYSTEM_DISK,
  V2V_TARGET_OPTIONS,
  V2V_VLAN_NETWORK,
} from '@/test/v2v-mapping-fixtures.ts'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import type { XoV2vVm } from '@vates/types'
import { mount, type VueWrapper } from '@vue/test-utils'

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

const OPTIONS_LIST_VM: V2vMigrationListVm = {
  ...V2V_OVERRIDDEN_LIST_VM,
  template: V2V_DEBIAN_TEMPLATE.id,
  keepMac: false,
  tags: ['web'],
}

// The tables and the fields render what the drawer hands them, each covered by its own test: here only the wiring
// matters
function mountDrawer({ vm = V2V_MAPPED_VM, listVm }: { vm?: XoV2vVm; listVm?: V2vMigrationListVm } = {}) {
  return mountV2vVmMappingComponent(
    (list, router) =>
      mount(V2vVmSettingsDrawer, {
        props: { vm, list },
        global: createGlobalTestConfig({
          router,
          stubs: { V2vDiskMappingTable: true, V2vNicMappingTable: true, V2vVmOptionsFields: true },
        }),
        attachTo: document.body,
      }),
    { listVm }
  )
}

function getOptionsFields(wrapper: VueWrapper) {
  return wrapper.getComponent(V2vVmOptionsFields)
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

it('names the VM in its title', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.text()).toContain(t('action:edit-vm-settings', { name: V2V_MAPPED_VM.name }))
})

it('maps the disks, then the network adapters, then sets the options', async () => {
  const wrapper = await mountDrawer()

  expect(findTitles(wrapper)).toEqual([t('disks'), t('network-adapters'), t('options')])
})

it.each([
  ['disks', { ...V2V_MAPPED_VM, disks: [] }, [t('network-adapters'), t('options')]],
  ['network adapters', { ...V2V_MAPPED_VM, nics: [] }, [t('disks'), t('options')]],
])('leaves out the %s of a VM without any', async (_, vm, titles) => {
  expect(findTitles(await mountDrawer({ vm }))).toEqual(titles)
})

it('maps the disks and the NICs of the VM on the targets of the pool of the list', async () => {
  const wrapper = await mountDrawer()
  const diskTable = wrapper.getComponent(V2vDiskMappingTable)

  expect(diskTable.props()).toMatchObject({ rows: V2V_DISK_ROWS, loading: false, readonly: false })
  expect(diskTable.props('srOptions').map(option => option.id)).toEqual(V2V_POOL_OFFERS.srs.map(sr => sr.id))
  expect(wrapper.getComponent(V2vNicMappingTable).props()).toEqual({
    rows: V2V_NIC_ROWS,
    networkOptions: V2V_TARGET_OPTIONS.networks,
    loading: false,
    readonly: false,
  })
})

it('shows the options of the VM', async () => {
  const wrapper = await mountDrawer({ listVm: OPTIONS_LIST_VM })

  expect(getOptionsFields(wrapper).props()).toEqual({
    keepMac: false,
    template: { value: V2V_DEBIAN_TEMPLATE.id, origin: 'overridden', isOffered: true },
    templateOptions: V2V_TARGET_OPTIONS.templates,
    tags: ['web'],
    loading: false,
  })
})

it('offers to cancel or to save', async () => {
  const wrapper = await mountDrawer()

  expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:save')])
})

it('shows the targets loading and cannot be saved while the pool offers load', async () => {
  xoCollectionsMock.areSrsReady.value = false

  const wrapper = await mountDrawer()

  expect([
    wrapper.getComponent(V2vDiskMappingTable).props('loading'),
    wrapper.getComponent(V2vNicMappingTable).props('loading'),
    getOptionsFields(wrapper).props('loading'),
    wrapper.getComponent(VtsOverlayConfirmButton).props('disabled'),
  ]).toEqual([true, true, true, true])
})

it('can be saved once the pool offers are loaded', async () => {
  const wrapper = await mountDrawer()

  expect(wrapper.getComponent(VtsOverlayConfirmButton).props('disabled')).toBe(false)
})

it.each([
  [
    'the SR of a disk',
    (wrapper: VueWrapper) =>
      wrapper.getComponent(V2vDiskMappingTable).vm.$emit('changeSr', V2V_SYSTEM_DISK.key, V2V_SSD_SR.id),
    { disks: { ...V2V_DISK_OVERRIDES, [V2V_SYSTEM_DISK.key]: V2V_SSD_SR.id }, nics: V2V_NIC_OVERRIDES },
  ],
  [
    'the network of a NIC',
    (wrapper: VueWrapper) =>
      wrapper.getComponent(V2vNicMappingTable).vm.$emit('changeNetwork', V2V_LAN_NIC.key, V2V_VLAN_NETWORK.id),
    { disks: V2V_DISK_OVERRIDES, nics: { ...V2V_NIC_OVERRIDES, [V2V_LAN_NIC.key]: V2V_VLAN_NETWORK.id } },
  ],
  [
    'the MAC addresses kept',
    (wrapper: VueWrapper) => getOptionsFields(wrapper).vm.$emit('changeKeepMac', false),
    { disks: V2V_DISK_OVERRIDES, nics: V2V_NIC_OVERRIDES, keepMac: false },
  ],
  [
    'the template',
    (wrapper: VueWrapper) => getOptionsFields(wrapper).vm.$emit('changeTemplate', V2V_DEBIAN_TEMPLATE.id),
    { disks: V2V_DISK_OVERRIDES, nics: V2V_NIC_OVERRIDES, template: V2V_DEBIAN_TEMPLATE.id },
  ],
  [
    'the tags',
    (wrapper: VueWrapper) => getOptionsFields(wrapper).vm.$emit('changeTags', ['prod']),
    { disks: V2V_DISK_OVERRIDES, nics: V2V_NIC_OVERRIDES, tags: ['prod'] },
  ],
  [
    'the SR of a disk reset',
    (wrapper: VueWrapper) =>
      wrapper.getComponent(V2vDiskMappingTable).vm.$emit('changeSr', V2V_DATA_DISK.key, undefined),
    { nics: V2V_NIC_OVERRIDES },
  ],
])('confirms the overrides of the VM once saved after a change of %s', async (_, change, overrides) => {
  const wrapper = await mountDrawer()

  change(wrapper)
  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toStrictEqual([[overrides]])
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('cancels once dismissed', async () => {
  const wrapper = await mountDrawer()

  wrapper.getComponent(UiDrawer).vm.$emit('dismiss')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})
