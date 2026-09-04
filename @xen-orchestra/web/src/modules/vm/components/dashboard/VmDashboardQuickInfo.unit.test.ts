import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import VmDashboardQuickInfo from '@/modules/vm/components/dashboard/VmDashboardQuickInfo.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { XoUser } from '@vates/types'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed, ref } from 'vue'

const { useXoVmCollectionMock, useGetPoolById, getVmHost, isMasterHost, buildXo5Route, useXoUserResourceMock } =
  vi.hoisted(() => ({
    useXoVmCollectionMock: vi.fn(),
    useGetPoolById: vi.fn(),
    getVmHost: vi.fn(),
    isMasterHost: vi.fn(),
    buildXo5Route: vi.fn(),
    useXoUserResourceMock: vi.fn(),
  }))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: useXoVmCollectionMock as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ useGetPoolById })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ isMasterHost })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => ({
  useXoUserResource: useXoUserResourceMock as unknown as typeof useXoUserResource,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  useXoVmCollectionMock.mockReset()
  useGetPoolById.mockReset()
  getVmHost.mockReset()
  isMasterHost.mockReset()
  buildXo5Route.mockReset()
  useXoUserResourceMock.mockReset()

  useXoVmCollectionMock.mockReturnValue({ areVmsReady: ref(true), getVmHost })
  useGetPoolById.mockReturnValue(computed(() => undefined))
  getVmHost.mockReturnValue(undefined)
  isMasterHost.mockReturnValue(false)
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
  useXoUserResourceMock.mockReturnValue({ user: computed(() => undefined) })
})

function mountQuickInfo(vm: FrontXoVm = createVm()) {
  return mount(VmDashboardQuickInfo, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('shows a busy state instead of the rows while the VMs are still loading', () => {
  useXoVmCollectionMock.mockReturnValue({ areVmsReady: ref(false), getVmHost })

  const wrapper = mountQuickInfo()

  expect(findLabelledValues(wrapper)).toEqual({})
})

it('lists every row of the card, in order', () => {
  const wrapper = mountQuickInfo()

  expect(wrapper.findAll('.vts-key-value-row').map(row => row.get('dt.label').text())).toEqual([
    'State',
    'IP address',
    'Created on',
    'Created by',
    'Started',
    'UUID',
    'Pool',
    'Host',
    'Description',
    'OS name',
    'Virtualization type',
    'Guest tools',
    'vCPUs',
    'RAM',
    'Tags',
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
    State: 'Paused',
    'IP address': '10.0.0.1',
    UUID: 'vm-42',
    Description: 'Serves the website',
    'OS name': 'Debian Bookworm',
    vCPUs: '2',
    RAM: '4 GiB',
  })
})

it('reports an HVM guest running the PV drivers as pvhvm', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'hvm', pvDriversDetected: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Virtualization type': 'pvhvm' })
})

it('reports the raw virtualization mode of an HVM guest without PV drivers', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'hvm', pvDriversDetected: false }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Virtualization type': 'hvm' })
})

it('reports the raw virtualization mode of a paravirtualized guest', () => {
  const wrapper = mountQuickInfo(createVm({ virtualizationMode: 'pv', pvDriversDetected: true }))

  expect(findLabelledValues(wrapper)).toMatchObject({ 'Virtualization type': 'pv' })
})

it('shows the pool and the host of the VM', () => {
  useGetPoolById.mockReturnValue(computed(() => createPool({ name_label: 'Production Pool' })))
  getVmHost.mockReturnValue(createHost({ name_label: 'Primary Host' }))

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ Pool: 'Production Pool', Host: 'Primary Host' })
})

it('falls back to "None" when the VM has neither a known pool nor a host', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ Pool: 'None', Host: 'None' })
})

it('shows the name of the user who created the VM', () => {
  useXoUserResourceMock.mockReturnValue({
    user: computed(() => ({ id: 'user-1', name: 'alice', email: 'alice@example.com' }) as XoUser),
  })

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ 'Created by': 'alice' })
})

it('falls back to "Unknown" when the creator of the VM is not known', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ 'Created by': 'Unknown' })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountQuickInfo(createVm({ tags: ['production', 'billing'] }))

  expect(wrapper.findAll('.ui-tag').map(tag => tag.text())).toEqual(['production', 'billing'])
})
