import HostDashboardVmsStatus from '@/modules/host/components/dashboard/HostDashboardVmsStatus.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardNumbers, findLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

const host = createHost({ id: 'host-1' as FrontXoHost['id'] })

function createVmInState(id: string, powerState: FrontXoVm['power_state'], hostId = host.id) {
  return createVm({ id: id as FrontXoVm['id'], $container: hostId, power_state: powerState })
}

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

function mountVmsStatus() {
  return mount(HostDashboardVmsStatus, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountVmsStatus()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('vms-status'))
})

it('shows a loader instead of the statuses while the hosts are still loading', () => {
  xoCollectionsMock.areHostsReady.value = false

  const wrapper = mountVmsStatus()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows a loader instead of the statuses while the VMs are still loading', () => {
  vmCollectionMock.areVmsReady.value = false

  const wrapper = mountVmsStatus()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('counts the VMs of the host in each power state', () => {
  vmCollectionMock.vms.value = [
    createVmInState('vm-1', VM_POWER_STATE.RUNNING),
    createVmInState('vm-2', VM_POWER_STATE.RUNNING),
    createVmInState('vm-3', VM_POWER_STATE.PAUSED),
    createVmInState('vm-4', VM_POWER_STATE.SUSPENDED),
    createVmInState('vm-5', VM_POWER_STATE.HALTED),
  ]

  const wrapper = mountVmsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '2'],
    [t('vm:status:paused', 2), '1'],
    [t('vm:status:suspended', 2), '1'],
    [t('vm:status:halted', 2), '1'],
  ])
})

it('totals the VMs of the host', () => {
  vmCollectionMock.vms.value = [
    createVmInState('vm-1', VM_POWER_STATE.RUNNING),
    createVmInState('vm-2', VM_POWER_STATE.HALTED),
  ]

  const wrapper = mountVmsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '2']])
})

it('keeps every power state in the legend for a host without VM', () => {
  const wrapper = mountVmsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '0'],
    [t('vm:status:paused', 2), '0'],
    [t('vm:status:suspended', 2), '0'],
    [t('vm:status:halted', 2), '0'],
  ])
})

it('leaves out the VMs running on another host', () => {
  vmCollectionMock.vms.value = [createVmInState('vm-1', VM_POWER_STATE.RUNNING, 'host-2' as FrontXoHost['id'])]

  const wrapper = mountVmsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '0']])
})

it('follows the VMs of the host as the collection changes', async () => {
  vmCollectionMock.vms.value = [createVmInState('vm-1', VM_POWER_STATE.RUNNING)]

  const wrapper = mountVmsStatus()

  vmCollectionMock.vms.value = [
    createVmInState('vm-1', VM_POWER_STATE.RUNNING),
    createVmInState('vm-2', VM_POWER_STATE.HALTED),
  ]
  await nextTick()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '1'],
    [t('vm:status:paused', 2), '0'],
    [t('vm:status:suspended', 2), '0'],
    [t('vm:status:halted', 2), '1'],
  ])
  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '2']])
})
