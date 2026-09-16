import VmHeader from '@/modules/vm/components/VmHeader.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createVm } from '@/test/create-vm.ts'
import {
  findHeadBarActionLink,
  findHeadBarActionsText,
  findHeadBarIconPaths,
  findHeadBarLabel,
  hasHeadBarMoreActionsButton,
  isHeadBarIconBusy,
} from '@/test/find-head-bar.ts'
import { findObjectIconPaths } from '@/test/find-icon-paths.ts'
import { findActiveTabLabels, findInAppTabHrefs, findTab, findTabLabels } from '@/test/find-tabs.ts'
import { createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'

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
  return mount(VmHeader, {
    props: { vm },
    global: await createGlobalTestConfigAt(initialPath),
  })
}

it('shows the name of the VM', async () => {
  const wrapper = await mountHeader(createVm({ name_label: 'Web server' }))

  expect(findHeadBarLabel(wrapper)).toBe('Web server')
})

it('lists every tab of the VM, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabLabels(wrapper)).toEqual([
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

  expect(findInAppTabHrefs(wrapper)).toEqual([
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

  const statsTab = findTab(wrapper, t('stats'))

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/vms/vm-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(createVm({ id: 'vm-42' as FrontXoVm['id'] }), '/vm/vm-42/system')

  expect(findActiveTabLabels(wrapper)).toEqual([t('system')])
})

it('marks no tab as active while no VM page is open', async () => {
  const wrapper = await mountHeader()

  expect(findActiveTabLabels(wrapper)).toEqual([])
})

it('links to the XO 5 page managing the lifecycle of the VM', async () => {
  const wrapper = await mountHeader()

  expect(findHeadBarActionLink(wrapper).attributes('href')).toBe('https://xo5.example.com/#/vms/vm-42/general')
})

it('offers the state-change and more-actions menus', async () => {
  const wrapper = await mountHeader()

  expect(findHeadBarActionsText(wrapper)).toContain(t('action:change-state'))
  expect(hasHeadBarMoreActionsButton(wrapper)).toBe(true)
})

it('shows the icon matching the power state of the VM', async () => {
  const wrapper = await mountHeader(createVm({ power_state: VM_POWER_STATE.PAUSED, current_operations: {} }))

  expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('vm', 'paused'))
  expect(findHeadBarIconPaths(wrapper)).not.toEqual(findObjectIconPaths('vm', 'running'))
  expect(isHeadBarIconBusy(wrapper)).toBe(false)
})

it('replaces the power state icon with a loader while the VM is changing state', async () => {
  const vm = createVm({ current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } })
  const wrapper = await mountHeader(vm)

  expect(isHeadBarIconBusy(wrapper)).toBe(true)
})
