import HostDashboardCpuProvisioning from '@/modules/host/components/dashboard/HostDashboardCpuProvisioning.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { itShowsCpuProvisioningShare } from '@/test/cpu-provisioning-card.ts'
import { createHost } from '@/test/create-host.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardNumbers, findProgressBarFillStyle } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { itShowsHostDashboardCard } from '@/test/host-dashboard-card.ts'
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

itShowsHostDashboardCard(mountProvisioning, {
  title: t('cpu-provisioning'),
  loading: { collections: ['hosts', 'VMs'], content: 'the provisioning', find: findCardNumbers },
})

const ASSIGNED_VCPUS_CASES = [
  {
    name: 'sums the vCPUs of the running VMs against the cores of the host',
    vms: () => [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)],
    assigned: '6',
  },
  {
    name: 'leaves out the vCPUs of the VMs that are not running',
    vms: () => [
      createRunningVm('vm-1', 2),
      createVm({
        id: 'vm-2' as FrontXoVm['id'],
        $container: host.id,
        power_state: VM_POWER_STATE.HALTED,
        CPUs: { max: 4, number: 4 },
      }),
    ],
    assigned: '2',
  },
  {
    name: 'leaves out the VMs running on another host',
    vms: () => [createRunningVm('vm-1', 2, 'host-2' as FrontXoHost['id'])],
    assigned: '0',
  },
  { name: 'reports no vCPU assigned for a host without VM', vms: () => [], assigned: '0' },
  {
    name: 'overprovisions past the cores of the host',
    vms: () => [createRunningVm('vm-1', 8), createRunningVm('vm-2', 8)],
    assigned: '16',
  },
]

for (const { name, vms, assigned } of ASSIGNED_VCPUS_CASES) {
  it(name, () => {
    vmCollectionMock.vms.value = vms()

    const wrapper = mountProvisioning()

    expect(findCardNumbers(wrapper)).toEqual([
      [t('vcpus-assigned'), assigned],
      [t('total-cpus'), '8'],
    ])
  })
}

// Two running VMs taking 6 vCPUs, 75% of the cores of the host
function mountWithSixVCpus(mountedHost = host) {
  vmCollectionMock.vms.value = [createRunningVm('vm-1', 2), createRunningVm('vm-2', 4)]

  return mountProvisioning(mountedHost)
}

itShowsCpuProvisioningShare(() => mountWithSixVCpus(), {
  fill: 'fills the progress bar with the share of the cores the running VMs took',
  legend: 'labels the progress bar with the share of the cores in use',
})

it('leaves the progress bar empty and the core count unknown when the host does not report its cores', () => {
  const wrapper = mountWithSixVCpus(createHost({ id: host.id, cpus: { sockets: 2 } }))

  expect(findProgressBarFillStyle(wrapper)).toBe('width: 0%;')
  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '-'],
  ])
})
