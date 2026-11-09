import AppHeaderMenu from '@/modules/navigation/components/AppHeaderMenu.vue'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { mount } from '@vue/test-utils'
import { computed, nextTick } from 'vue'

const { buildXo5Route } = vi.hoisted(() => ({
  buildXo5Route: vi.fn(),
}))

vi.mock(import('@/shared/remote-resources/use-xo-routes.ts'), () => ({
  useXoRoutes: (() => ({ buildXo5Route })) as unknown as typeof useXoRoutes,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms: computed(() => []) })) as unknown as typeof useXoVmCollection,
}))

beforeEach(() => {
  buildXo5Route.mockReset()
  buildXo5Route.mockImplementation((path: string) => `https://xo5.example.com/#${path}`)
})

async function mountOpenedMenu() {
  const wrapper = mount(AppHeaderMenu, { global: createGlobalTestConfig() })

  await wrapper.get('button.ui-button-icon').trigger('click')
  await nextTick()

  return wrapper
}

function findPanel(wrapper: Awaited<ReturnType<typeof mountOpenedMenu>>) {
  return wrapper.findComponent(UiPanel)
}

function findTitle(wrapper: Awaited<ReturnType<typeof mountOpenedMenu>>) {
  return findPanel(wrapper).get('.header .typo-h6').text()
}

function findLinks(wrapper: Awaited<ReturnType<typeof mountOpenedMenu>>) {
  return findPanel(wrapper)
    .findAll('.menu-item a')
    .map(link => [link.text(), link.attributes('href')])
}

async function goBack(wrapper: Awaited<ReturnType<typeof mountOpenedMenu>>) {
  await findPanel(wrapper).get('.header button.ui-button-icon').trigger('click')
  await nextTick()
}

async function openThirdParties(wrapper: Awaited<ReturnType<typeof mountOpenedMenu>>) {
  const thirdPartiesItem = findPanel(wrapper)
    .findAll('.menu-trigger')
    .find(trigger => trigger.text() === t('third-parties'))

  await thirdPartiesItem?.trigger('click')
  await nextTick()
}

it('stays closed until the more actions button is clicked', () => {
  const wrapper = mount(AppHeaderMenu, { global: createGlobalTestConfig() })

  expect(wrapper.findComponent(UiPanel).exists()).toBe(false)
})

it('lists the link to XO 5 and the third party apps', async () => {
  const wrapper = await mountOpenedMenu()

  expect(findTitle(wrapper)).toBe(t('more-actions'))
  expect(findLinks(wrapper)).toEqual([[t('action:open-app', { name: t('xo-5') }), 'https://xo5.example.com/#/']])
  expect(findPanel(wrapper).text()).toContain(t('third-parties'))
})

it('opens the third party apps in place', async () => {
  const wrapper = await mountOpenedMenu()

  await openThirdParties(wrapper)

  expect(findTitle(wrapper)).toBe(t('third-parties'))
  expect(findLinks(wrapper)).toEqual([
    [t('action:install-app', { name: 'DC Scope' }), 'https://xo5.example.com/#/hub/recipes'],
    [t('action:install-app', { name: 'DC Netscope' }), 'https://xo5.example.com/#/hub/recipes'],
  ])
})

it('goes back from the third party apps to the menu, then closes', async () => {
  const wrapper = await mountOpenedMenu()

  await openThirdParties(wrapper)
  await goBack(wrapper)

  expect(findTitle(wrapper)).toBe(t('more-actions'))

  await goBack(wrapper)

  expect(wrapper.findComponent(UiPanel).exists()).toBe(false)
})
