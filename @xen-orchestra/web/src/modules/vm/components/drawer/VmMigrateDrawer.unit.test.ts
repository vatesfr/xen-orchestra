import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
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
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { chooseSelectOption } from '@core-test/select.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

mockXoCollections('host', 'network', 'pbd', 'pif', 'pool', 'sr')

mockXoVmDeviceCollections('vbd', 'vdi', 'vif')

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

beforeEach(() => {
  xoCollectionsMock.reset()
  vmDeviceCollectionsMock.reset()

  xoCollectionsMock.pools.value = pools
  xoCollectionsMock.hosts.value = hosts
  xoCollectionsMock.networks.value = networks
  xoCollectionsMock.pifs.value = pifs
  xoCollectionsMock.srs.value = srs
  // The SR is reachable from the target host unless a test disconnects it
  xoCollectionsMock.pbds.value = [sourceHostPbd, targetHostPbd]
  vmDeviceCollectionsMock.vbds.value = vbds
  vmDeviceCollectionsMock.vdis.value = vdis
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

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

async function clickButton(wrapper: VueWrapper, label: string) {
  await getButton(wrapper, label).trigger('click')
  await flushPromises()
}

async function mountDrawerAtMappingStep(vm?: FrontXoVm) {
  const wrapper = await mountDrawer(vm)
  await chooseSelectOption(wrapper, 'Target host', { container: getField(wrapper, t('destination-host')) })
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
    xoCollectionsMock.pbds.value = [sourceHostPbd]

    const wrapper = await mountDrawerAtMappingStep()

    expect(wrapper.find('.vts-error-list').exists()).toBe(false)

    await submit(wrapper)

    expect(isOnMappingStep(wrapper)).toBe(true)
    expect(wrapper.find('.vts-error-list').exists()).toBe(true)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('hides the errors again when going back to the general step', async () => {
    xoCollectionsMock.pbds.value = [sourceHostPbd]

    const wrapper = await mountDrawerAtMappingStep()
    await submit(wrapper)
    await clickButton(wrapper, t('action:back'))
    await submit(wrapper)

    expect(wrapper.find('.vts-error-list').exists()).toBe(false)
  })
})
