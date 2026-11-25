import AppHeaderMenu from '@/modules/navigation/components/AppHeaderMenu.vue'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { vmCollectionMock, mockXoVmCollection } from '@/test/mock-xo-vm-collection.ts'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { findLinks } from '@core-test/find-links.ts'
import { clickMenuItem, openMoreActions } from '@core-test/menu.ts'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

mockXoRoutes()

mockXoVmCollection()

beforeEach(() => {
  vmCollectionMock.reset()
})

async function mountOpenedMenu() {
  const wrapper = mount(AppHeaderMenu, { global: createGlobalTestConfig() })

  await openMoreActions(wrapper)

  return wrapper
}

function findPanel(wrapper: VueWrapper) {
  return wrapper.findComponent(UiPanel)
}

function findTitle(wrapper: VueWrapper) {
  return findPanel(wrapper).get('.header .typo-h6').text()
}

function findMenuLinks(wrapper: VueWrapper) {
  return findLinks(findPanel(wrapper), '.menu-item a')
}

function findBackButton(wrapper: VueWrapper) {
  return findPanel(wrapper).get('.header button.ui-button-icon')
}

async function goBack(wrapper: VueWrapper) {
  await findBackButton(wrapper).trigger('click')
  await nextTick()
}

async function pressEscape() {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  await nextTick()
}

async function openThirdParties(wrapper: VueWrapper) {
  await clickMenuItem(findPanel(wrapper), t('third-parties'))
}

it('stays closed until the more actions button is clicked', () => {
  const wrapper = mount(AppHeaderMenu, { global: createGlobalTestConfig() })

  expect(wrapper.findComponent(UiPanel).exists()).toBe(false)
})

it('lists the link to XO 5 and the third party apps', async () => {
  const wrapper = await mountOpenedMenu()

  expect(findTitle(wrapper)).toBe(t('more-actions'))
  expect(findMenuLinks(wrapper)).toEqual([[t('action:open-app', { name: t('xo-5') }), 'https://xo5.example.com/#/']])
  expect(findPanel(wrapper).text()).toContain(t('third-parties'))
})

it('opens the third party apps in place', async () => {
  const wrapper = await mountOpenedMenu()

  await openThirdParties(wrapper)

  expect(findTitle(wrapper)).toBe(t('third-parties'))
  expect(findMenuLinks(wrapper)).toEqual([
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

it('goes back from the third party apps to the menu, then closes, on Escape', async () => {
  const wrapper = await mountOpenedMenu()

  await openThirdParties(wrapper)
  await pressEscape()

  expect(findTitle(wrapper)).toBe(t('more-actions'))

  await pressEscape()

  expect(wrapper.findComponent(UiPanel).exists()).toBe(false)
})

it('names the back button after what it does', async () => {
  const wrapper = await mountOpenedMenu()

  expect(findBackButton(wrapper).attributes('aria-label')).toBe(t('action:close'))

  await openThirdParties(wrapper)

  expect(findBackButton(wrapper).attributes('aria-label')).toBe(t('action:go-back'))
})

it('is a dialog named after its title', async () => {
  const wrapper = await mountOpenedMenu()
  const panel = findPanel(wrapper)

  expect(panel.attributes('role')).toBe('dialog')
  expect(panel.get(`#${panel.attributes('aria-labelledby')}`).text()).toBe(t('more-actions'))
})
