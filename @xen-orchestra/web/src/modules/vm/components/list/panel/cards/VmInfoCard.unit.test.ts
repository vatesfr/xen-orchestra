import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import VmInfoCard from '@/modules/vm/components/list/panel/cards/VmInfoCard.vue'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type {
  FrontXoVmTemplate,
  useXoVmTemplateCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createHost } from '@/test/create-host.ts'
import { createPool } from '@/test/create-pool.ts'
import { createVm } from '@/test/create-vm.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import type { XoUser } from '@vates/types'
import { HOST_POWER_STATE, VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { computed } from 'vue'

const { useGetPoolById, getVmHost, isMasterHost, buildXo5Route, useXoUserResourceMock, useXoVmTemplateCollectionMock } =
  vi.hoisted(() => ({
    useGetPoolById: vi.fn(),
    getVmHost: vi.fn(),
    isMasterHost: vi.fn(),
    buildXo5Route: vi.fn(),
    useXoUserResourceMock: vi.fn(),
    useXoVmTemplateCollectionMock: vi.fn(),
  }))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({ useGetPoolById })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ getVmHost })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ isMasterHost })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/user/remote-resources/use-xo-user.ts'), () => ({
  useXoUserResource: useXoUserResourceMock as unknown as typeof useXoUserResource,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'), () => ({
  useXoVmTemplateCollection: useXoVmTemplateCollectionMock as unknown as typeof useXoVmTemplateCollection,
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  useGetPoolById.mockReset()
  getVmHost.mockReset()
  isMasterHost.mockReset()
  buildXo5Route.mockReset()
  useXoUserResourceMock.mockReset()
  useXoVmTemplateCollectionMock.mockReset()

  useGetPoolById.mockReturnValue(computed(() => undefined))
  getVmHost.mockReturnValue(undefined)
  isMasterHost.mockReturnValue(false)
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
  useXoUserResourceMock.mockReturnValue({ user: computed(() => undefined) })
  useXoVmTemplateCollectionMock.mockReturnValue({ templates: computed(() => []) })
})

function createTemplate(overrides: Partial<FrontXoVmTemplate> = {}) {
  return {
    id: 'template-1',
    uuid: 'template-uuid-1',
    name_label: 'Debian 12',
    $pool: 'pool-789',
    ...overrides,
  } as FrontXoVmTemplate
}

function mountInfoCard(vm: FrontXoVm = createVm()) {
  return mount(VmInfoCard, {
    props: { vm },
    global: createGlobalTestConfig(),
  })
}

it('renders the name and the id of the VM as the card title', () => {
  const wrapper = mountInfoCard(createVm({ name_label: 'Web server', id: 'vm-42' as FrontXoVm['id'] }))

  expect(wrapper.get('.vts-card-object-title').text()).toContain('Web server')
  expect(wrapper.get('.vts-card-object-title').text()).toContain('vm-42')
})

it('lists every row of the card, in order', () => {
  const wrapper = mountInfoCard()

  expect(wrapper.findAll('.vts-card-row-key-value').map(row => row.get('.key').text())).toEqual([
    'State',
    'Description',
    'Tags',
    'Pool',
    'Host',
    'OS name',
    'Guest tools',
    'Template',
    'Created on',
    'Created by',
    'Started',
  ])
})

it('shows the power state, description and OS name of the VM', () => {
  const wrapper = mountInfoCard(
    createVm({
      power_state: VM_POWER_STATE.HALTED,
      name_description: 'Serves the website',
      os_version: { name: 'Debian Bookworm' } as FrontXoVm['os_version'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({
    State: 'Halted',
    Description: 'Serves the website',
    'OS name': 'Debian Bookworm',
  })
})

it('renders one tag per VM tag', () => {
  const wrapper = mountInfoCard(createVm({ tags: ['production', 'billing'] }))

  expect(wrapper.findAll('.ui-tag').map(tag => tag.text())).toEqual(['production', 'billing'])
})

it('shows the name of the pool hosting the VM', () => {
  useGetPoolById.mockReturnValue(computed(() => createPool({ name_label: 'Production Pool' })))

  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ Pool: 'Production Pool' })
})

it('leaves the pool row empty when the pool is unknown', () => {
  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ Pool: '' })
})

it('shows the name of the host running the VM', () => {
  getVmHost.mockReturnValue(createHost({ name_label: 'Primary Host', power_state: HOST_POWER_STATE.RUNNING }))

  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ Host: 'Primary Host' })
})

it('leaves the host row empty when the VM runs on no host', () => {
  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ Host: '' })
})

it('shows the name of the template the VM was created from', () => {
  useXoVmTemplateCollectionMock.mockReturnValue({ templates: computed(() => [createTemplate()]) })

  const wrapper = mountInfoCard(
    createVm({
      $pool: 'pool-789' as FrontXoVm['$pool'],
      creation: { template: 'template-uuid-1' } as FrontXoVm['creation'],
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({ Template: 'Debian 12' })
})

it('ignores a same-uuid template belonging to another pool', () => {
  useXoVmTemplateCollectionMock.mockReturnValue({
    templates: computed(() => [createTemplate({ $pool: 'pool-other' as FrontXoVmTemplate['$pool'] })]),
  })

  const wrapper = mountInfoCard(
    createVm({
      $pool: 'pool-789' as FrontXoVm['$pool'],
      creation: { template: 'template-uuid-1' } as FrontXoVm['creation'],
      other: { base_template_name: 'Debian 12 (removed)' },
    })
  )

  expect(findCardLabelledValues(wrapper)).toMatchObject({ Template: 'Debian 12 (removed)' })
})

it('shows the name of the user who created the VM', () => {
  useXoUserResourceMock.mockReturnValue({
    user: computed(() => ({ id: 'user-1', name: 'alice', email: 'alice@example.com' }) as XoUser),
  })

  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ 'Created by': 'alice' })
})

it('falls back to the email of the user who created the VM', () => {
  useXoUserResourceMock.mockReturnValue({
    user: computed(() => ({ id: 'user-1', name: '', email: 'alice@example.com' }) as XoUser),
  })

  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ 'Created by': 'alice@example.com' })
})

it('falls back to "Unknown" when the creator of the VM is not known', () => {
  expect(findCardLabelledValues(mountInfoCard())).toMatchObject({ 'Created by': 'Unknown' })
})
