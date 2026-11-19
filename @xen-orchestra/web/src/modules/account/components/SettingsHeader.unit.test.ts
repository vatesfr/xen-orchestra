import SettingsHeader from '@/modules/account/components/SettingsHeader.vue'
import { createTestRouter } from '@/test/create-test-router.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

async function mountHeader(initialPath?: string) {
  const router = createTestRouter()

  if (initialPath !== undefined) {
    await router.push(initialPath)
  }

  return mount(SettingsHeader, {
    global: createGlobalTestConfig({ router }),
  })
}

function findTabs(wrapper: Awaited<ReturnType<typeof mountHeader>>) {
  return wrapper.findAll('.ui-tab-item')
}

it('shows settings in the head bar', async () => {
  const wrapper = await mountHeader()

  expect(wrapper.get('.ui-head-bar').text()).toBe(t('settings'))
})

it('lists the account and the preferences tabs, in order', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.text())).toEqual([t('account'), t('preferences')])
})

it('points every tab at its settings page', async () => {
  const wrapper = await mountHeader()

  expect(findTabs(wrapper).map(tab => tab.attributes('href'))).toEqual(['/settings/account', '/settings/preferences'])
})

it('marks the tab of the current route as the active one', async () => {
  const wrapper = await mountHeader('/settings/preferences')

  expect(
    findTabs(wrapper)
      .filter(tab => tab.classes('active'))
      .map(tab => tab.text())
  ).toEqual([t('preferences')])
})

it('marks no tab as active outside of the settings pages', async () => {
  const wrapper = await mountHeader('/')

  expect(findTabs(wrapper).filter(tab => tab.classes('active'))).toEqual([])
})
