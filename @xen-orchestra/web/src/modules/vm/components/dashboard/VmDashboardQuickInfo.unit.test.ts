import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VmDashboardQuickInfo from '@/modules/vm/components/dashboard/VmDashboardQuickInfo.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVm } from '@/test/create-vm.ts'
import { itShowsDashboardQuickInfo } from '@/test/dashboard-quick-info.ts'
import { findLabelledValues, findTags, findVmTagsLabel } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { userResourceMock, mockXoUser } from '@/test/mock-xo-user.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import { vmDeviceCollectionsMock, mockXoVmDeviceCollections } from '@/test/mock-xo-vm-device-collections.ts'
import { seedVmDisks } from '@/test/seed-vm-disks.ts'
import { itShowsVmCreator } from '@/test/vm-creator.ts'
import { findLink, findLinks } from '@core-test/find-links.ts'
import { VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

mockXoVmCollection()

mockXoVmDeviceCollections('vbd', 'vdi')

mockXoCollections('host', 'pool', 'sr')

mockXoUser()

mockXoRoutes()

beforeEach(() => {
  vmCollectionMock.reset()
  vmDeviceCollectionsMock.reset()
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
    t('storage'),
    t('description'),
    t('os-name'),
    t('virtualization-type'),
    t('guest-tools'),
    t('vcpus'),
    t('ram'),
  ],
  createWithAddress: (uuid, mainIpAddress) => createVm({ id: uuid as FrontXoVm['id'], mainIpAddress }),
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

describe('storages', () => {
  const srA = createSr({ id: 'sr-a' as FrontXoSr['id'], name_label: 'Local SR' })
  const srB = createSr({ id: 'sr-b' as FrontXoSr['id'], name_label: 'Shared NFS' })
  const srC = createSr({ id: 'sr-c' as FrontXoSr['id'], name_label: 'iSCSI' })
  const srIso = createSr({ id: 'sr-iso' as FrontXoSr['id'], name_label: 'ISO library' })

  beforeEach(() => {
    xoCollectionsMock.srs.value = [srA, srB, srC, srIso]
  })

  const onSr = (sr: FrontXoSr) => ({ vdi: { $SR: sr.id } })

  function mountWithDisks(disks: Parameters<typeof seedVmDisks>[0]) {
    return mountQuickInfo(createVm({ $VBDs: seedVmDisks(disks) }))
  }

  it.each([
    {
      label: 'shows the storage without a "+n" link when the disks of the VM are on a single storage',
      disks: [onSr(srA), onSr(srA)],
      expected: ['Local SR'],
    },
    {
      label: 'shows the first storage followed by a "+n" link counting the others',
      disks: [onSr(srA), onSr(srB), onSr(srC)],
      expected: ['Local SR', t('plus-n', { n: 2 })],
    },
    {
      label: 'lists each storage holding a disk of the VM once, even when it holds several disks',
      disks: [onSr(srA), onSr(srA), onSr(srB)],
      expected: ['Local SR', t('plus-n', { n: 1 })],
    },
    {
      label: 'ignores the ISO mounted in a CD drive',
      disks: [onSr(srA), { vbd: { is_cd_drive: true }, ...onSr(srIso) }],
      expected: ['Local SR'],
    },
  ])('$label', ({ disks, expected }) => {
    expect(
      mountWithDisks(disks)
        .findAll('.storage li')
        .map(item => item.text())
    ).toEqual(expected)
  })

  it('links the displayed storage to its page', () => {
    const links = findLinks(mountWithDisks([onSr(srA)]).get('.storage'))

    expect(links.map(([, href]) => href)).toEqual(['/sr/sr-a/general'])
  })

  it('links the "+n" to the disks of the VM', () => {
    const link = findLink(mountWithDisks([onSr(srA), onSr(srB), onSr(srC)]).get('.storage li:last-child'))

    expect(link?.href).toBe('/vm/vm-123/vdis')
  })

  it('falls back to "None" when the VM has no disk', () => {
    expect(findLabelledValues(mountQuickInfo())).toMatchObject({ [t('storage')]: t('none') })
  })
})

it('renders the tags below their label', () => {
  const wrapper = mountQuickInfo(createVm({ tags: ['production'] }))

  expect(findVmTagsLabel(wrapper)).toBe(t('tags'))
  expect(wrapper.find('.vm-tags-editor > .ui-tags-list').exists()).toBe(true)
})

it('renders one tag per VM tag, in alphabetical order', () => {
  const wrapper = mountQuickInfo(createVm({ tags: ['production', 'billing'] }))

  expect(findTags(wrapper)).toEqual(['billing', 'production'])
})
