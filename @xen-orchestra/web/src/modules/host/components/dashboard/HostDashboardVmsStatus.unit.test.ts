import HostDashboardVmsStatus from '@/modules/host/components/dashboard/HostDashboardVmsStatus.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLegends } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

const { useXoHostCollectionMock, useXoVmCollectionMock } = vi.hoisted(() => ({
  useXoHostCollectionMock: vi.fn(),
  useXoVmCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: useXoHostCollectionMock as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: useXoVmCollectionMock as unknown as typeof useXoVmCollection,
}))

const host = createHost({ id: 'host-1' as FrontXoHost['id'] })

const vmsByHost = ref(new Map<FrontXoHost['id'], FrontXoVm[]>())

function givenVmsByHost(vms: Map<FrontXoHost['id'], FrontXoVm[]>) {
  vmsByHost.value = vms
  useXoVmCollectionMock.mockReturnValue({ vmsByHost, areVmsReady: ref(true) })
}

function givenHostVms(vms: FrontXoVm[]) {
  givenVmsByHost(new Map([[host.id, vms]]))
}

function createVmInState(id: string, powerState: FrontXoVm['power_state']) {
  return createVm({ id: id as FrontXoVm['id'], power_state: powerState })
}

beforeEach(() => {
  useXoHostCollectionMock.mockReset()
  useXoVmCollectionMock.mockReset()
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(true) })
  givenHostVms([])
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
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(false) })

  const wrapper = mountVmsStatus()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows a loader instead of the statuses while the VMs are still loading', () => {
  useXoVmCollectionMock.mockReturnValue({ vmsByHost: ref(new Map()), areVmsReady: ref(false) })

  const wrapper = mountVmsStatus()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('counts the VMs of the host in each power state', () => {
  givenHostVms([
    createVmInState('vm-1', VM_POWER_STATE.RUNNING),
    createVmInState('vm-2', VM_POWER_STATE.RUNNING),
    createVmInState('vm-3', VM_POWER_STATE.PAUSED),
    createVmInState('vm-4', VM_POWER_STATE.SUSPENDED),
    createVmInState('vm-5', VM_POWER_STATE.HALTED),
  ])

  const wrapper = mountVmsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '2'],
    [t('vm:status:paused', 2), '1'],
    [t('vm:status:suspended', 2), '1'],
    [t('vm:status:halted', 2), '1'],
  ])
})

it('totals the VMs of the host', () => {
  givenHostVms([createVmInState('vm-1', VM_POWER_STATE.RUNNING), createVmInState('vm-2', VM_POWER_STATE.HALTED)])

  const wrapper = mountVmsStatus()

  expect(wrapper.get('.ui-card-numbers').text()).toBe(`${t('total')}2`)
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
  givenVmsByHost(new Map([['host-2' as FrontXoHost['id'], [createVmInState('vm-1', VM_POWER_STATE.RUNNING)]]]))

  const wrapper = mountVmsStatus()

  expect(wrapper.get('.ui-card-numbers').text()).toBe(`${t('total')}0`)
})

it('follows the VMs of the host as the collection changes', async () => {
  givenHostVms([createVmInState('vm-1', VM_POWER_STATE.RUNNING)])

  const wrapper = mountVmsStatus()

  vmsByHost.value = new Map([
    [host.id, [createVmInState('vm-1', VM_POWER_STATE.RUNNING), createVmInState('vm-2', VM_POWER_STATE.HALTED)]],
  ])
  await nextTick()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '1'],
    [t('vm:status:paused', 2), '0'],
    [t('vm:status:suspended', 2), '0'],
    [t('vm:status:halted', 2), '1'],
  ])
  expect(wrapper.get('.ui-card-numbers').text()).toBe(`${t('total')}2`)
})
