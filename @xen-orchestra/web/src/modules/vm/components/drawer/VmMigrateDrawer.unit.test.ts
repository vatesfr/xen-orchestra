import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPbd, useXoPbdCollection } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPif, useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import VmMigrateDrawer from '@/modules/vm/components/drawer/VmMigrateDrawer.vue'
import VmMigrateVdisTable from '@/modules/vm/components/form/migrate/VmMigrateVdisTable.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPbd } from '@/test/create-pbd.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { groupBy } from '@/test/group-by.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

const {
  useXoPoolCollectionMock,
  useXoHostCollectionMock,
  useXoNetworkCollectionMock,
  useXoPifCollectionMock,
  useXoSrCollectionMock,
  useXoPbdCollectionMock,
  useXoVbdCollectionMock,
  useXoVdiCollectionMock,
  useXoVifCollectionMock,
} = vi.hoisted(() => ({
  useXoPoolCollectionMock: vi.fn(),
  useXoHostCollectionMock: vi.fn(),
  useXoNetworkCollectionMock: vi.fn(),
  useXoPifCollectionMock: vi.fn(),
  useXoSrCollectionMock: vi.fn(),
  useXoPbdCollectionMock: vi.fn(),
  useXoVbdCollectionMock: vi.fn(),
  useXoVdiCollectionMock: vi.fn(),
  useXoVifCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: useXoPoolCollectionMock as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/network/remote-resources/use-xo-network-collection.ts'), () => ({
  useXoNetworkCollection: useXoNetworkCollectionMock as unknown as typeof useXoNetworkCollection,
}))

vi.mock(import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'), () => ({
  useXoPifCollection: useXoPifCollectionMock as unknown as typeof useXoPifCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: useXoSrCollectionMock as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'), () => ({
  useXoPbdCollection: useXoPbdCollectionMock as unknown as typeof useXoPbdCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: useXoVbdCollectionMock as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: useXoVdiCollectionMock as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/vif/remote-resources/use-xo-vif-collection.ts'), () => ({
  useXoVifCollection: useXoVifCollectionMock as unknown as typeof useXoVifCollection,
}))

const POOL_ID = 'pool-1' as FrontXoPool['id']
const SOURCE_HOST_ID = 'host-src' as FrontXoHost['id']
const TARGET_HOST_ID = 'host-dst' as FrontXoHost['id']
const NETWORK_ID = 'net-mgmt' as FrontXoNetwork['id']
const PIF_ID = 'pif-1' as FrontXoPif['id']
const SR_ID = 'sr-1' as FrontXoSr['id']
const VDI_ID = 'vdi-1' as FrontXoVdi['id']
const VBD_ID = 'vbd-1' as FrontXoVbd['id']

const pools = [createPool({ id: POOL_ID, name_label: 'Pool', otherConfig: {} })]

const hosts = [
  createHost({ id: SOURCE_HOST_ID, name_label: 'Source host', $pool: POOL_ID }),
  createHost({ id: TARGET_HOST_ID, name_label: 'Target host', $pool: POOL_ID }),
]

const networks = [createNetwork({ id: NETWORK_ID, name_label: 'Management', $pool: POOL_ID, PIFs: [PIF_ID] })]

const pifs = [
  createPif({
    id: PIF_ID,
    $host: TARGET_HOST_ID,
    $pool: POOL_ID,
    $network: NETWORK_ID,
    ip: '10.0.0.2',
    management: true,
  }),
]

const srs = [createSr({ id: SR_ID, name_label: 'Shared SR', $pool: POOL_ID, shared: true })]

const sourceHostPbd = createPbd({ id: 'pbd-src' as FrontXoPbd['id'], SR: SR_ID, host: SOURCE_HOST_ID, $pool: POOL_ID })
const targetHostPbd = createPbd({ id: 'pbd-dst' as FrontXoPbd['id'], SR: SR_ID, host: TARGET_HOST_ID, $pool: POOL_ID })

const vdis = [createVdi({ id: VDI_ID, name_label: 'Disk', $SR: SR_ID, $pool: POOL_ID })]

const vbds = [createVbd({ id: VBD_ID, VDI: VDI_ID })]

// The SR is reachable from the target host unless a test disconnects it
const loadedPbds = ref<FrontXoPbd[]>([])

beforeEach(() => {
  useXoPoolCollectionMock.mockReset()
  useXoHostCollectionMock.mockReset()
  useXoNetworkCollectionMock.mockReset()
  useXoPifCollectionMock.mockReset()
  useXoSrCollectionMock.mockReset()
  useXoPbdCollectionMock.mockReset()
  useXoVbdCollectionMock.mockReset()
  useXoVdiCollectionMock.mockReset()
  useXoVifCollectionMock.mockReset()

  loadedPbds.value = [sourceHostPbd, targetHostPbd]

  useXoPoolCollectionMock.mockReturnValue({
    pools: computed(() => pools),
    useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
      computed(() => pools.find(pool => pool.id === toValue(id))),
  })

  useXoHostCollectionMock.mockReturnValue({
    hostsByPool: computed(() => groupBy(hosts, host => host.$pool)),
    getHostById: (id: FrontXoHost['id'] | undefined) => hosts.find(host => host.id === id),
  })

  useXoNetworkCollectionMock.mockReturnValue({
    networks: computed(() => networks),
    getNetworkById: (id: FrontXoNetwork['id'] | undefined) => networks.find(network => network.id === id),
  })

  useXoPifCollectionMock.mockReturnValue({
    pifsByHost: computed(() => groupBy(pifs, pif => pif.$host)),
    getPifsByIds: (ids: FrontXoPif['id'][]) => pifs.filter(pif => ids.includes(pif.id)),
  })

  useXoSrCollectionMock.mockReturnValue({
    srs: computed(() => srs),
    getSrById: (id: FrontXoSr['id'] | undefined) => srs.find(sr => sr.id === id),
  })

  useXoPbdCollectionMock.mockReturnValue({
    pbdsBySr: computed(() => groupBy(loadedPbds.value, pbd => pbd.SR)),
    getPbdsByIds: (ids: FrontXoPbd['id'][]) => loadedPbds.value.filter(pbd => ids.includes(pbd.id)),
  })

  useXoVbdCollectionMock.mockReturnValue({
    getVbdsByIds: (ids: FrontXoVbd['id'][]) => vbds.filter(vbd => ids.includes(vbd.id)),
  })

  useXoVdiCollectionMock.mockReturnValue({
    useGetVdisByIds: (ids: MaybeRefOrGetter<FrontXoVdi['id'][]>) =>
      computed(() => vdis.filter(vdi => toValue(ids).includes(vdi.id))),
  })

  useXoVifCollectionMock.mockReturnValue({
    useGetVifsByIds: (ids: MaybeRefOrGetter<FrontXoVif['id'][]>) => computed(() => toValue(ids).map(() => undefined)),
  })
})

async function mountDrawer(vm: FrontXoVm = createVm({ $pool: POOL_ID, $container: SOURCE_HOST_ID, $VBDs: [VBD_ID] })) {
  const wrapper = mount(VmMigrateDrawer, { props: { vm }, global: createGlobalTestConfig(), attachTo: document.body })
  await flushPromises()

  return wrapper
}

function findButtonLabels(wrapper: VueWrapper) {
  return wrapper.findAll('.buttons button').map(button => button.text())
}

function isOnMappingStep(wrapper: VueWrapper) {
  return wrapper.findComponent(VmMigrateVdisTable).exists()
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

async function select(wrapper: VueWrapper, label: string, optionLabel: string) {
  await getField(wrapper, label).get('.vts-select .ui-input').trigger('click')
  await flushPromises()

  const option = wrapper.findAll('.ui-dropdown').find(option => option.text().startsWith(optionLabel))

  if (option === undefined) {
    throw new Error(`No option "${optionLabel}" in the select labelled "${label}"`)
  }

  await option.trigger('click')
  await flushPromises()
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

async function clickButton(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll('.buttons button').find(button => button.text() === label)

  if (button === undefined) {
    throw new Error(`No button "${label}"`)
  }

  await button.trigger('click')
  await flushPromises()
}

async function mountDrawerAtMappingStep(vm?: FrontXoVm) {
  const wrapper = await mountDrawer(vm)
  await select(wrapper, t('destination-host'), 'Target host')
  await submit(wrapper)

  return wrapper
}

describe('general step', () => {
  it('is the first step, offering to cancel or to continue', async () => {
    const wrapper = await mountDrawer()

    expect(isOnMappingStep(wrapper)).toBe(false)
    expect(findButtonLabels(wrapper)).toEqual([t('cancel'), t('action:continue')])
  })

  it('cancels from the cancel button', async () => {
    const wrapper = await mountDrawer()

    await clickButton(wrapper, t('cancel'))

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('stays on the general step when it is submitted without a destination host', async () => {
    const wrapper = await mountDrawer()

    await submit(wrapper)

    expect(isOnMappingStep(wrapper)).toBe(false)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })
})

describe('mapping step', () => {
  it('follows a valid general step, offering to go back or to migrate', async () => {
    const wrapper = await mountDrawerAtMappingStep()

    expect(isOnMappingStep(wrapper)).toBe(true)
    expect(findButtonLabels(wrapper)).toEqual([t('action:back'), t('action:migrate')])
  })

  it('goes back to the general step, without cancelling', async () => {
    const wrapper = await mountDrawerAtMappingStep()

    await clickButton(wrapper, t('action:back'))

    expect(isOnMappingStep(wrapper)).toBe(false)
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('does not confirm before it is submitted', async () => {
    const wrapper = await mountDrawerAtMappingStep()

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the general and mapping payloads merged when it is submitted', async () => {
    const wrapper = await mountDrawerAtMappingStep()

    await submit(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ hostId: TARGET_HOST_ID }]])
  })

  it('stays on the mapping step and lists the errors when a disk has no destination SR', async () => {
    loadedPbds.value = [sourceHostPbd]

    const wrapper = await mountDrawerAtMappingStep()

    expect(wrapper.find('.vts-error-list').exists()).toBe(false)

    await submit(wrapper)

    expect(isOnMappingStep(wrapper)).toBe(true)
    expect(wrapper.find('.vts-error-list').exists()).toBe(true)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('hides the errors again when going back to the general step', async () => {
    loadedPbds.value = [sourceHostPbd]

    const wrapper = await mountDrawerAtMappingStep()
    await submit(wrapper)
    await clickButton(wrapper, t('action:back'))
    await submit(wrapper)

    expect(wrapper.find('.vts-error-list').exists()).toBe(false)
  })
})
