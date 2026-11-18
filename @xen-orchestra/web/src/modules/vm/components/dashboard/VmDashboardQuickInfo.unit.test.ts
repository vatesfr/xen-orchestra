import VmDashboardQuickInfo from '@/modules/vm/components/dashboard/VmDashboardQuickInfo.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCopiedValues, findLabelledValues, findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { userResourceMock } from '@/test/mock-xo-user.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import type { XoUser } from '@vates/types'
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

it('shows a busy state instead of the rows while the VMs are still loading', () => {
  vmCollectionMock.areVmsReady.value = false

  const wrapper = mountQuickInfo()

  expect(findLabelledValues(wrapper)).toEqual({})
})

it('lists every row of the card, in order', () => {
  const wrapper = mountQuickInfo()

  expect(wrapper.findAll('.vts-key-value-row').map(row => row.get('dt.label').text())).toEqual([
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
  ])
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

it('offers to copy the IP address and the UUID of the VM', () => {
  const wrapper = mountQuickInfo(createVm({ id: 'vm-42' as FrontXoVm['id'], mainIpAddress: '10.0.0.1' }))

  expect(findCopiedValues(wrapper)).toEqual({ [t('ip-address')]: '10.0.0.1', [t('uuid')]: 'vm-42' })
})

it('reports an HVM guest running the PV drivers as pvhvm', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'hvm', pvDriversDetected: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('virtualization-type')]: 'pvhvm' })
})

it('reports the raw virtualization mode of an HVM guest without PV drivers', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'hvm', pvDriversDetected: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('virtualization-type')]: 'hvm' })
})

it('reports the raw virtualization mode of a paravirtualized guest', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'pv', pvDriversDetected: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ [t('virtualization-type')]: 'pv' })
})

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

it('shows the name of the user who created the VM', () => {
  userResourceMock.user.value = { id: 'user-1', name: 'alice', email: 'alice@example.com' } as XoUser

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('created-by')]: 'alice' })
})

it('falls back to "Unknown" when the creator of the VM is not known', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('created-by')]: t('unknown') })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountQuickInfo(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['production', 'billing'])
})
