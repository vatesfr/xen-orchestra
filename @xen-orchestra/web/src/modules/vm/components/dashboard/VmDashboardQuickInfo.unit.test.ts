import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import type { FrontXoVbd, useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi, useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VmDashboardQuickInfo from '@/modules/vm/components/dashboard/VmDashboardQuickInfo.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCopiedValues, findLabelledValues, findTags } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { XoUser } from '@vates/types'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed, ref, toValue } from 'vue'

const {
  useXoVmCollectionMock,
  useGetPoolById,
  getVmHost,
  isMasterHost,
  buildXo5Route,
  useXoUserResourceMock,
  getVbdsByIds,
  useGetVdisByIds,
  useGetSrsByIds,
} = vi.hoisted(() => ({
  useXoVmCollectionMock: vi.fn(),
  useGetPoolById: vi.fn(),
  getVmHost: vi.fn(),
  isMasterHost: vi.fn(),
  buildXo5Route: vi.fn(),
  useXoUserResourceMock: vi.fn(),
  getVbdsByIds: vi.fn(),
  useGetVdisByIds: vi.fn(),
  useGetSrsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ useGetVdisByIds })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({ useGetSrsByIds })) as unknown as typeof useXoSrCollection,
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
  getVbdsByIds.mockReset()
  useGetVdisByIds.mockReset()
  useGetSrsByIds.mockReset()

  getVbdsByIds.mockReturnValue([])
  useGetVdisByIds.mockReturnValue(computed(() => []))
  useGetSrsByIds.mockReturnValue(computed(() => []))
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
    t('state'),
    t('ip-address'),
    t('created-on'),
    t('created-by'),
    t('started'),
    t('uuid'),
    t('pool'),
    t('host'),
    t('storages'),
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
  useGetPoolById.mockReturnValue(computed(() => createPool({ name_label: 'Production Pool' })))
  getVmHost.mockReturnValue(createHost({ name_label: 'Primary Host' }))

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({
    [t('pool')]: 'Production Pool',
    [t('host')]: 'Primary Host',
  })
})

it('falls back to "None" when the VM has neither a known pool nor a host', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('pool')]: t('none'), [t('host')]: t('none') })
})

describe('storages', () => {
  const srA = createSr({ id: 'sr-a' as FrontXoSr['id'], name_label: 'Local SR' })
  const srB = createSr({ id: 'sr-b' as FrontXoSr['id'], name_label: 'Shared NFS' })
  const srIso = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO library' })

  const vdis = [
    createVdi({ id: 'vdi-1' as FrontXoVdi['id'], $SR: srA.id }),
    createVdi({ id: 'vdi-2' as FrontXoVdi['id'], $SR: srA.id }),
    createVdi({ id: 'vdi-3' as FrontXoVdi['id'], $SR: srB.id }),
    createVdi({ id: 'vdi-iso' as FrontXoVdi['id'], $SR: srIso.id }),
  ]

  beforeEach(() => {
    useGetVdisByIds.mockImplementation((ids: unknown) =>
      computed(() => vdis.filter(vdi => (toValue(ids) as string[]).includes(vdi.id)))
    )
    useGetSrsByIds.mockImplementation((ids: unknown) =>
      computed(() => [srA, srB, srIso].filter(sr => (toValue(ids) as string[]).includes(sr.id)))
    )
  })

  it('lists each storage holding a disk of the VM once, even when it holds several disks', () => {
    getVbdsByIds.mockReturnValue([
      createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VDI: 'vdi-1' as FrontXoVbd['VDI'] }),
      createVbd({ id: 'vbd-2' as FrontXoVbd['id'], VDI: 'vdi-2' as FrontXoVbd['VDI'] }),
      createVbd({ id: 'vbd-3' as FrontXoVbd['id'], VDI: 'vdi-3' as FrontXoVbd['VDI'] }),
    ])

    const wrapper = mountQuickInfo()

    expect(wrapper.findAll('.storages li').map(li => li.text())).toEqual(['Local SR', 'Shared NFS'])
  })

  it('ignores the ISO mounted in a CD drive', () => {
    getVbdsByIds.mockReturnValue([
      createVbd({ id: 'vbd-1' as FrontXoVbd['id'], VDI: 'vdi-1' as FrontXoVbd['VDI'] }),
      createVbd({ id: 'vbd-cd' as FrontXoVbd['id'], VDI: 'vdi-iso' as FrontXoVbd['VDI'], is_cd_drive: true }),
    ])

    const wrapper = mountQuickInfo()

    expect(wrapper.findAll('.storages li').map(li => li.text())).toEqual(['Local SR'])
  })

  it('falls back to "None" when the VM has no disk', () => {
    expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('storages')]: t('none') })
  })
})

it('shows the name of the user who created the VM', () => {
  useXoUserResourceMock.mockReturnValue({
    user: computed(() => ({ id: 'user-1', name: 'alice', email: 'alice@example.com' }) as XoUser),
  })

  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('created-by')]: 'alice' })
})

it('falls back to "Unknown" when the creator of the VM is not known', () => {
  expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('created-by')]: t('unknown') })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountQuickInfo(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['production', 'billing'])
})
