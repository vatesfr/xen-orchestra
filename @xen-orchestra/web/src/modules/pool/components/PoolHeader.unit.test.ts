import PoolHeader from '@/modules/pool/components/PoolHeader.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createPool } from '@/test/create-pool.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
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
  const router = createTestRouter()

  if (initialPath !== undefined) {
    await router.push(initialPath)
  }

  return mount(PoolHeader, {
    props: { pool },
    global: createGlobalTestConfig({ router }),
  })
}

function findTabs(wrapper: Awaited<ReturnType<typeof mountHeader>>) {
  return wrapper.findAll('.ui-tab-item')
}

it('shows the name of the pool', async () => {
  const wrapper = await mountHeader(createPool({ name_label: 'Production' }))

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('Production')
})

it('lists every tab of the pool, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.text())).toEqual([
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

  const inAppHrefs = findTabs(wrapper)
    .filter(tab => tab.element.tagName === 'A')
    .map(tab => tab.attributes('href'))

  expect(inAppHrefs).toEqual([
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

  const statsTab = findTabs(wrapper).find(tab => tab.text() === t('stats'))!

  expect(statsTab.element.tagName).not.toBe('A')
  expect(statsTab.get('a').attributes('href')).toBe('https://xo5.example.com/#/pools/pool-42/stats')
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader(createPool({ id: 'pool-42' as FrontXoPool['id'] }), '/pool/pool-42/system')

  const activeTabs = findTabs(wrapper)
    .filter(tab => tab.classes('active'))
    .map(tab => tab.text())

  expect(activeTabs).toEqual([t('system')])
})

it('marks no tab as active while no pool page is open', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).filter(tab => tab.classes('active'))).toHaveLength(0)
})

it('offers to create a VM on that pool', async () => {
  const wrapper = await mountHeader()

  const newVmLink = wrapper.get('.ui-head-bar .actions a')

  expect(newVmLink.text()).toBe(t('new-vm'))
  expect(newVmLink.attributes('href')).toBe('/vm/new?poolid=pool-42')
})
