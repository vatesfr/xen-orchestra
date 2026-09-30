import VmHeader from '@/modules/vm/components/VmHeader.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createVm } from '@/test/create-vm.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { mount, type DOMWrapper } from '@vue/test-utils'

const { buildXo5Route } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
})

async function mountHeader(vm: FrontXoVm = createVm({ id: 'vm-42' as FrontXoVm['id'] }), initialPath?: string) {
  const router = createTestRouter()

  if (initialPath !== undefined) {
    await router.push(initialPath)
  }

  return mount(VmHeader, {
    props: { vm },
    global: createGlobalTestConfig({ router }),
  })
}

function findTabs(wrapper: Awaited<ReturnType<typeof mountHeader>>) {
  return wrapper.findAll('.ui-tab-item')
}

/**
 * An icon renders as bare `<svg>` paths, so the only way to name the one a
 * component picked is to compare it with a reference render of the icon it was
 * meant to pick — the rendering counterpart of asserting `objectIcon(…)`.
 */
function findIconPaths(wrapper: { findAll: (selector: string) => DOMWrapper<Element>[] }) {
  return wrapper.findAll('.icon-path').map(path => path.attributes('d'))
}

function mountVmStateIcon(state: 'running' | 'paused' | 'halted' | 'suspended') {
  return mount(VtsObjectIcon, {
    props: { type: 'vm' as const, state, size: 'medium' as const },
    global: createGlobalTestConfig(),
  })
}

it('shows the name of the VM', async () => {
  const wrapper = await mountHeader(createVm({ name_label: 'Web server' }))

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('Web server')
})

it('lists every tab of the VM, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.text())).toEqual([
    t('dashboard'),
    t('console'),
    t('backups'),
    t('stats'),
    t('system'),
    t('network'),
    t('vdis'),
    t('snapshots'),
    t('tasks'),
  ])
})

it('points every in-app tab at the page of that VM', async () => {
  const wrapper = await mountHeader()

  const inAppHrefs = findTabs(wrapper)
    .filter(tab => tab.element.tagName === 'A')
    .map(tab => tab.attributes('href'))

  expect(inAppHrefs).toEqual([
    '/vm/vm-42/dashboard',
    '/vm/vm-42/console',
    '/vm/vm-42/backups',
    '/vm/vm-42/system',
    '/vm/vm-42/networks',
    '/vm/vm-42/vdis',
    '/vm/vm-42/snapshots',
    '/vm/vm-42/tasks',
  ])
})

it('sends the stats tab to XO 5 rather than to an in-app page', async () => {
  const wrapper = await mountHeader()

  const statsTab = findTabs(wrapper).find(tab => tab.text() === t('stats'))!

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/vms/vm-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(createVm({ id: 'vm-42' as FrontXoVm['id'] }), '/vm/vm-42/system')

  const activeTabs = findTabs(wrapper)
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())

  expect(activeTabs).toEqual([t('system')])
})

it('marks no tab as active while no VM page is open', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).filter(tab => tab.classes('active'))).toHaveLength(0)
})

it('links to the XO 5 page managing the lifecycle of the VM', async () => {
  const wrapper = await mountHeader()

  expect(wrapper.get('.ui-head-bar .actions a').attributes('href')).toBe('https://xo5.example.com/#/vms/vm-42/general')
})

it('offers the state-change and more-actions menus', async () => {
  const wrapper = await mountHeader()

  expect(wrapper.get('.ui-head-bar .actions').text()).toContain(t('action:change-state'))
  expect(wrapper.find('.ui-head-bar .actions button.ui-button-icon').exists()).toBe(true)
})

it('shows the icon matching the power state of the VM', async () => {
  const wrapper = await mountHeader(createVm({ power_state: VM_POWER_STATE.PAUSED, current_operations: {} }))

  expect(findIconPaths(wrapper.get('.ui-head-bar .label-wrapper'))).toEqual(findIconPaths(mountVmStateIcon('paused')))
  expect(findIconPaths(wrapper.get('.ui-head-bar .label-wrapper'))).not.toEqual(
    findIconPaths(mountVmStateIcon('running'))
  )
  expect(wrapper.find('.ui-head-bar .label-wrapper .ui-loader').exists()).toBe(false)
})

it('replaces the power state icon with a loader while the VM is changing state', async () => {
  const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } })
  const wrapper = await mountHeader(vm)

  expect(wrapper.find('.ui-head-bar .label-wrapper .ui-loader').exists()).toBe(true)
})
