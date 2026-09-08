import HostDashboardCpuProvisioning from '@/modules/host/components/dashboard/HostDashboardCpuProvisioning.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

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

const host = createHost({ id: 'host-1' as FrontXoHost['id'], cpus: { cores: 8, sockets: 2 } })

function givenVmsByHost(vmsByHost: Map<FrontXoHost['id'], FrontXoVm[]>) {
  useXoVmCollectionMock.mockReturnValue({ vmsByHost: ref(vmsByHost), areVmsReady: ref(true) })
}

function givenHostVms(vms: FrontXoVm[]) {
  givenVmsByHost(new Map([[host.id, vms]]))
}

function createRunningVm(id: string, vCpus: number) {
  return createVm({
    id: id as FrontXoVm['id'],
    power_state: VM_POWER_STATE.RUNNING,
    CPUs: { max: vCpus, number: vCpus },
  })
}

beforeEach(() => {
  useXoHostCollectionMock.mockReset()
  useXoVmCollectionMock.mockReset()
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(true) })
  givenHostVms([])
})

function mountProvisioning(mountedHost = host) {
  return mount(HostDashboardCpuProvisioning, {
    props: { host: mountedHost },
    global: createGlobalTestConfig(),
  })
}

function findNumbers(wrapper: ReturnType<typeof mountProvisioning>) {
  return wrapper.findAll('.ui-card-numbers').map(card => [card.get('.label').text(), card.get('.values').text()])
}

it('renders the card title', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('cpu-provisioning'))
})

it('shows a loader instead of the provisioning while the hosts are still loading', () => {
  useXoHostCollectionMock.mockReturnValue({ areHostsReady: ref(false) })

  const wrapper = mountProvisioning()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findNumbers(wrapper)).toEqual([])
})

it('shows a loader instead of the provisioning while the VMs are still loading', () => {
  useXoVmCollectionMock.mockReturnValue({ vmsByHost: ref(new Map()), areVmsReady: ref(false) })

  const wrapper = mountProvisioning()

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findNumbers(wrapper)).toEqual([])
})

it('sums the vCPUs of the running VMs against the cores of the host', () => {
  givenHostVms([createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)])

  const wrapper = mountProvisioning()

  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '8'],
  ])
})

it('leaves out the vCPUs of the VMs that are not running', () => {
  givenHostVms([
    createRunningVm('vm-1', 2),
    createVm({ id: 'vm-2' as FrontXoVm['id'], power_state: VM_POWER_STATE.HALTED, CPUs: { max: 4, number: 4 } }),
  ])

  const wrapper = mountProvisioning()

  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '2'],
    [t('total-cpus'), '8'],
  ])
})

it('leaves out the VMs running on another host', () => {
  givenVmsByHost(new Map([['host-2' as FrontXoHost['id'], [createRunningVm('vm-1', 2)]]]))

  const wrapper = mountProvisioning()

  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '0'],
    [t('total-cpus'), '8'],
  ])
})

it('reports no vCPU assigned for a host without VM', () => {
  const wrapper = mountProvisioning()

  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '0'],
    [t('total-cpus'), '8'],
  ])
})

it('fills the progress bar with the share of the cores the running VMs took', () => {
  givenHostVms([createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)])

  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 75%;')
})

it('labels the progress bar with the share of the cores in use', () => {
  givenHostVms([createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)])

  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-legend').text()).toBe(`${t('vcpus')}75%`)
})

it('overprovisions past the cores of the host', () => {
  givenHostVms([createRunningVm('vm-1', 8), createRunningVm('vm-2', 8)])

  const wrapper = mountProvisioning()

  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '16'],
    [t('total-cpus'), '8'],
  ])
})

it('scales the progress bar by the assigned vCPUs when the host does not report its cores', () => {
  givenHostVms([createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)])

  const wrapper = mountProvisioning(createHost({ id: host.id, cpus: { sockets: 2 } }))

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 100%;')
  expect(findNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '0'],
  ])
})
