import HostDashboardCpuProvisioning from '@/modules/host/components/dashboard/HostDashboardCpuProvisioning.vue'
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

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

const host = createHost({ id: 'host-1' as FrontXoHost['id'], cpus: { cores: 8, sockets: 2 } })

function createRunningVm(id: string, vCpus: number, hostId = host.id) {
  return createVm({
    id: id as FrontXoVm['id'],
    $container: hostId,
    power_state: VM_POWER_STATE.RUNNING,
    CPUs: { max: vCpus, number: vCpus },
  })
}

beforeEach(() => {
  xoCollectionsMock.reset()
  vmCollectionMock.reset()
})

function mountProvisioning(mountedHost = host) {
  return mount(HostDashboardCpuProvisioning, {
    props: { host: mountedHost },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('cpu-provisioning'))
})

it('shows a loader instead of the provisioning while the hosts are still loading', () => {
  xoCollectionsMock.areHostsReady.value = false

  const wrapper = mountProvisioning()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows a loader instead of the provisioning while the VMs are still loading', () => {
  vmCollectionMock.areVmsReady.value = false

  const wrapper = mountProvisioning()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('sums the vCPUs of the running VMs against the cores of the host', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)]

  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '8'],
  ])
})

it('leaves out the vCPUs of the VMs that are not running', () => {
  vmCollectionMock.vms.value = [
    createRunningVm('vm-1', 2),
    createVm({
      id: 'vm-2' as FrontXoVm['id'],
      $container: host.id,
      power_state: VM_POWER_STATE.HALTED,
      CPUs: { max: 4, number: 4 },
    }),
  ]

  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '2'],
    [t('total-cpus'), '8'],
  ])
})

it('leaves out the VMs running on another host', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2, 'host-2' as FrontXoHost['id'])]

  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '0'],
    [t('total-cpus'), '8'],
  ])
})

it('reports no vCPU assigned for a host without VM', () => {
  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '0'],
    [t('total-cpus'), '8'],
  ])
})

it('fills the progress bar with the share of the cores the running VMs took', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)]

  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 75%;')
})

it('labels the progress bar with the share of the cores in use', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)]

  const wrapper = mountProvisioning()

  expect(findLegends(wrapper)).toEqual([[t('vcpus'), '75%']])
})

it('overprovisions past the cores of the host', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 8), createRunningVm('vm-2', 8)]

  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '16'],
    [t('total-cpus'), '8'],
  ])
})

it('leaves the progress bar empty and the core count unknown when the host does not report its cores', () => {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)]

  const wrapper = mountProvisioning(createHost({ id: host.id, cpus: { sockets: 2 } }))

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 0%;')
  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '-'],
  ])
})
