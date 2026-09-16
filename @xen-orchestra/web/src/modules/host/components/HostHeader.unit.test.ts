import HostHeader from '@/modules/host/components/HostHeader.vue'
import type { FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createHost } from '@/test/create-host.ts'
import {
  findHeadBarActionLink,
  findHeadBarActionsText,
  findHeadBarIconPaths,
  findHeadBarLabel,
  hasHeadBarMoreActionsButton,
  hasHeadBarStatus,
  isHeadBarIconBusy,
} from '@/test/find-head-bar.ts'
import { findObjectIconPaths } from '@/test/find-icon-paths.ts'
import { findActiveTabLabels, findInAppTabHrefs, findTab, findTabLabels } from '@/test/find-tabs.ts'
import { createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { givenSmallScreen } from '@/test/viewport.ts'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { buildXo5Route, isMasterHost, useXoVmCollectionMock } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
  isMasterHost: vi.fn(),
  useXoVmCollectionMock: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ isMasterHost })) as unknown as typeof useXoHostCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: useXoVmCollectionMock as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
  isMasterHost.mockReset()
  useXoVmCollectionMock.mockReset()

  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
  isMasterHost.mockReturnValue(false)
  useXoVmCollectionMock.mockReturnValue({ vmsByHost: ref(new Map()) })
})

async function mountHeader(
  host: FrontXoHost = createHost({ id: 'host-42' as FrontXoHost['id'], $pool: 'pool-7' as FrontXoHost['$pool'] }),
  initialPath?: string
) {
  return mount(HostHeader, {
    props: { host },
    global: await createGlobalTestConfigAt(initialPath),
  })
}

it('shows the name of the host', async () => {
  const wrapper = await mountHeader(createHost({ name_label: 'Primary Host' }))

  expect(findHeadBarLabel(wrapper)).toBe('Primary Host')
})

it('lists every tab of the host, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabLabels(wrapper)).toEqual([
    t('dashboard'),
    t('console'),
    t('stats'),
    t('system'),
    t('network'),
    t('storage'),
    t('tasks'),
    t('vms'),
  ])
})

it('points every in-app tab at the page of that host', async () => {
  const wrapper = await mountHeader()

  expect(findInAppTabHrefs(wrapper)).toEqual([
    '/host/host-42/dashboard',
    '/host/host-42/console',
    '/host/host-42/system',
    '/host/host-42/networks',
    '/host/host-42/storage',
    '/host/host-42/tasks',
    '/host/host-42/vms',
  ])
})

it('sends the stats tab to XO 5 rather than to an in-app page', async () => {
  const wrapper = await mountHeader()

  const statsTab = findTab(wrapper, t('stats'))

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/hosts/host-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(undefined, '/host/host-42/system')

  expect(findActiveTabLabels(wrapper)).toEqual([t('system')])
})

it('marks no tab as active while no host page is open', async () => {
  const wrapper = await mountHeader()

  expect(findActiveTabLabels(wrapper)).toEqual([])
})

it('offers to create a VM on the pool of the host', async () => {
  const wrapper = await mountHeader()

  const newVmLink = findHeadBarActionLink(wrapper)

  expect(newVmLink.text()).toBe(t('new-vm'))
  expect(newVmLink.attributes('href')).toBe('/vm/new?poolid=pool-7')
})

it('offers the state-change and more-actions menus', async () => {
  const wrapper = await mountHeader()

  expect(findHeadBarActionsText(wrapper)).toContain(t('action:change-state'))
  expect(hasHeadBarMoreActionsButton(wrapper)).toBe(true)
})

it('drops the state-change menu on a screen too small for it, keeping the more actions one', async () => {
  givenSmallScreen()

  const wrapper = await mountHeader()

  expect(findHeadBarActionsText(wrapper)).not.toContain(t('action:change-state'))
  expect(hasHeadBarMoreActionsButton(wrapper)).toBe(true)
})

it('flags the host as the primary of its pool', async () => {
  isMasterHost.mockReturnValue(true)

  const wrapper = await mountHeader()

  expect(hasHeadBarStatus(wrapper)).toBe(true)
})

it('does not flag a host that does not lead its pool', async () => {
  const wrapper = await mountHeader()

  expect(hasHeadBarStatus(wrapper)).toBe(false)
})

it('shows the icon matching the state of the host', async () => {
  const wrapper = await mountHeader(createHost({ power_state: HOST_POWER_STATE.HALTED }))

  expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('host', 'halted'))
  expect(findHeadBarIconPaths(wrapper)).not.toEqual(findObjectIconPaths('host', 'running'))
})

it('shows the disabled icon for a running host that is not enabled', async () => {
  const wrapper = await mountHeader(createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false }))

  expect(findHeadBarIconPaths(wrapper)).toEqual(findObjectIconPaths('host', 'disabled'))
})

it('replaces the state icon with a loader while the host is changing state', async () => {
  const wrapper = await mountHeader(
    createHost({
      current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT } as FrontXoHost['current_operations'],
    })
  )

  expect(isHeadBarIconBusy(wrapper)).toBe(true)
})

it('keeps the state icon while no operation is pending on the host', async () => {
  const wrapper = await mountHeader(createHost({ current_operations: {} }))

  expect(isHeadBarIconBusy(wrapper)).toBe(false)
})
