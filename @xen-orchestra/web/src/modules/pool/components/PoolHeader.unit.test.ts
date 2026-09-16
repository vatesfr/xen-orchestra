import PoolHeader from '@/modules/pool/components/PoolHeader.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createPool } from '@/test/create-pool.ts'
import { findHeadBarActionLink, findHeadBarLabel } from '@/test/find-head-bar.ts'
import { findActiveTabLabels, findInAppTabHrefs, findTab, findTabLabels } from '@/test/find-tabs.ts'
import { createGlobalTestConfigAt } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
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

async function mountHeader(
  pool: FrontXoPool = createPool({ id: 'pool-42' as FrontXoPool['id'] }),
  initialPath?: string
) {
  return mount(PoolHeader, {
    props: { pool },
    global: await createGlobalTestConfigAt(initialPath),
  })
}

it('shows the name of the pool', async () => {
  const wrapper = await mountHeader(createPool({ name_label: 'Production' }))

  expect(findHeadBarLabel(wrapper)).toBe('Production')
})

it('lists every tab of the pool, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabLabels(wrapper)).toEqual([
    t('dashboard'),
    t('stats'),
    t('system'),
    t('network'),
    t('traffic-rules'),
    t('storage'),
    t('tasks'),
    t('hosts'),
    t('vms'),
  ])
})

it('points every in-app tab at the page of that pool', async () => {
  const wrapper = await mountHeader()

  expect(findInAppTabHrefs(wrapper)).toEqual([
    '/pool/pool-42/dashboard',
    '/pool/pool-42/system',
    '/pool/pool-42/networks',
    '/pool/pool-42/traffic-rules',
    '/pool/pool-42/storage',
    '/pool/pool-42/tasks',
    '/pool/pool-42/hosts',
    '/pool/pool-42/vms',
  ])
})

it('sends the stats tab to XO 5 rather than to an in-app page', async () => {
  const wrapper = await mountHeader()

  const statsTab = findTab(wrapper, t('stats'))

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/pools/pool-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(createPool({ id: 'pool-42' as FrontXoPool['id'] }), '/pool/pool-42/system')

  expect(findActiveTabLabels(wrapper)).toEqual([t('system')])
})

it('marks no tab as active while no pool page is open', async () => {
  const wrapper = await mountHeader()

  expect(findActiveTabLabels(wrapper)).toEqual([])
})

it('offers to create a VM on that pool', async () => {
  const wrapper = await mountHeader()

  const newVmLink = findHeadBarActionLink(wrapper)

  expect(newVmLink.text()).toBe(t('new-vm'))
  expect(newVmLink.attributes('href')).toBe('/vm/new?poolid=pool-42')
})
