import VmDashboardQuickInfo from '@/modules/vm/components/dashboard/VmDashboardQuickInfo.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { itShowsDashboardQuickInfo } from '@/test/dashboard-quick-info.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { userResourceMock } from '@/test/mock-xo-user.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { itShowsVmCreator } from '@/test/vm-creator.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockModule(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

mockModule(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

mockModule(import('@/modules/user/remote-resources/use-xo-user.ts'), () => import('@/test/mock-xo-user.ts'))

mockModule(import('@/shared/remote-resources/use-xo-routes.ts'), () => import('@/test/mock-xo-routes.ts'))

beforeEach(() => {
  vmCollectionMock.reset()
  xoCollectionsMock.reset()
  userResourceMock.reset()
})

function mountQuickInfo(vm: FrontXoVm = createVm()) {
  return mount(VmDashboardQuickInfo, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

itShowsDashboardQuickInfo(mountQuickInfo, {
  objectName: 'VM',
  loadingCollection: 'VMs',
  rows: [
    t('state'),
    t('ip-address'),
    t('created-on'),
    t('created-by'),
    t('started'),
    t('uuid'),
    t('pool'),
    t('host'),
    t('description'),
    t('os-name'),
    t('virtualization-type'),
    t('guest-tools'),
    t('vcpus'),
    t('ram'),
    t('tags'),
  ],
  createWithAddress: (uuid, mainIpAddress) => createVm({ id: uuid as FrontXoVm['id'], mainIpAddress }),
  createWithTags: tags => createVm({ tags }),
})

it('shows the identity, power state and resources of the VM', () => {
  const wrapper = mountQuickInfo(
    createVm({
      id: 'vm-42' as FrontXoVm['id'],
      power_state: VM_POWER_STATE.PAUSED,
      mainIpAddress: '10.0.0.1',
      name_description: 'Serves the website',
      os_version: { name: 'Debian Bookworm' } as FrontXoVm['os_version'],
      CPUs: { number: 2, max: 4 },
      memory: { size: 4294967296, dynamic: [0, 0], static: [0, 0] },
    })
  )

  expect(findLabelledValues(wrapper)).toMatchObject({
    [t('state')]: t('vm:status:paused'),
    [t('ip-address')]: '10.0.0.1',
    [t('uuid')]: 'vm-42',
    [t('description')]: 'Serves the website',
    [t('os-name')]: 'Debian Bookworm',
    [t('vcpus')]: '2',
    [t('ram')]: '4 GiB',
  })
})

const VIRTUALIZATION_TYPE_CASES: { name: string; vm: Partial<FrontXoVm>; type: string }[] = [
  {
    name: 'reports an HVM guest running the PV drivers as pvhvm',
    vm: { virtualizationMode: 'hvm', pvDriversDetected: true },
    type: 'pvhvm',
  },
  {
    name: 'reports the raw virtualization mode of an HVM guest without PV drivers',
    vm: { virtualizationMode: 'hvm', pvDriversDetected: false },
    type: 'hvm',
  },
  {
    name: 'reports the raw virtualization mode of a paravirtualized guest',
    vm: { virtualizationMode: 'pv', pvDriversDetected: true },
    type: 'pv',
  },
]

for (const { name, vm, type } of VIRTUALIZATION_TYPE_CASES) {
  it(name, () => {
    const wrapper = mountQuickInfo(createVm(vm))

    expect(findLabelledValues(wrapper)).toMatchObject({ [t('virtualization-type')]: type })
  })
}

it('shows the pool and the host of the VM', () => {
  xoCollectionsMock.pools.value = [createPool({ name_label: 'Production Pool' })]
  xoCollectionsMock.hosts.value = [createHost({ name_label: 'Primary Host' })]

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({
    [t('pool')]: 'Production Pool',
    [t('host')]: 'Primary Host',
  })
})

it('falls back to "None" when the VM has neither a known pool nor a host', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('pool')]: t('none'), [t('host')]: t('none') })
})

itShowsVmCreator(() => findLabelledValues(mountQuickInfo()))
