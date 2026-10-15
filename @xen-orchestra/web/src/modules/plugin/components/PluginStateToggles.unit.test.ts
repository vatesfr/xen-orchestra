import PluginStateToggles from '@/modules/plugin/components/PluginStateToggles.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount } from '@vue/test-utils'

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), () => ({
  useXoTaskCollection: (() => ({ useGetTaskById: vi.fn() })) as unknown as typeof useXoTaskCollection,
}))

beforeEach(() => {
  vi.mocked(fetch).mockReset()
})

function mountToggles(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginStateToggles, { props: { plugin }, global: createGlobalTestConfig() })
}

function findToggles(wrapper: ReturnType<typeof mountToggles>) {
  return Object.fromEntries(
    wrapper.findAll('.ui-toggle').map(toggle => {
      const input = toggle.get<HTMLInputElement>('input')

      return [toggle.get('.label').text(), { checked: input.element.checked, disabled: input.element.disabled }]
    })
  )
}

async function changeToggle(wrapper: ReturnType<typeof mountToggles>, label: string, checked: boolean) {
  const toggle = wrapper.findAll('.ui-toggle').find(toggle => toggle.get('.label').text() === label)

  if (toggle === undefined) {
    throw new Error(`no "${label}" toggle`)
  }

  await toggle.get('input').setValue(checked)
}

function findRequests() {
  return vi.mocked(fetch).mock.calls.map(([url, init]) => ({ url, method: init?.method, body: init?.body }))
}

it('reflects whether the plugin is loaded and loaded at startup', () => {
  const wrapper = mountToggles(createPlugin({ loaded: true, autoload: false }))

  expect(findToggles(wrapper)).toEqual({
    [t('loaded')]: { checked: true, disabled: false },
    [t('load-at-startup')]: { checked: false, disabled: false },
  })
})

it('disables the loaded toggle of a plugin which cannot be unloaded', () => {
  const wrapper = mountToggles(createPlugin({ loaded: true, unloadable: false }))

  expect(findToggles(wrapper)).toEqual({
    [t('loaded')]: { checked: true, disabled: true },
    [t('load-at-startup')]: { checked: true, disabled: false },
  })
})

it('disables the loaded toggle of a plugin which must be configured before being loaded', () => {
  const wrapper = mountToggles(createPlugin({ loaded: false, configured: false }))

  expect(findToggles(wrapper)[t('loaded')]).toEqual({ checked: false, disabled: true })
})

it('unloads a loaded plugin when the loaded toggle is turned off', async () => {
  const wrapper = mountToggles(createPlugin({ id: 'auth-ldap' as FrontXoPlugin['id'], loaded: true }))

  await changeToggle(wrapper, t('loaded'), false)

  expect(findRequests()).toEqual([
    { url: '/rest/v0/plugins/auth-ldap/actions/unload', method: 'POST', body: undefined },
  ])
})

it('loads an unloaded plugin when the loaded toggle is turned on', async () => {
  const wrapper = mountToggles(createPlugin({ id: 'auth-ldap' as FrontXoPlugin['id'], loaded: false }))

  await changeToggle(wrapper, t('loaded'), true)

  expect(findRequests()).toEqual([{ url: '/rest/v0/plugins/auth-ldap/actions/load', method: 'POST', body: undefined }])
})

it('turns off the autoload when the autoload toggle is turned off', async () => {
  const wrapper = mountToggles(createPlugin({ id: 'auth-ldap' as FrontXoPlugin['id'], autoload: true }))

  await changeToggle(wrapper, t('load-at-startup'), false)

  expect(findRequests()).toEqual([
    { url: '/rest/v0/plugins/auth-ldap', method: 'PATCH', body: JSON.stringify({ autoload: false }) },
  ])
})

it('disables both toggles while the plugin is being loaded or unloaded', async () => {
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  await changeToggle(wrapper, t('loaded'), false)

  expect(Object.values(findToggles(wrapper)).map(toggle => toggle.disabled)).toEqual([true, true])
})

it('disables both toggles while the autoload is being updated', async () => {
  const wrapper = mountToggles(createPlugin({ loaded: true }))

  await changeToggle(wrapper, t('load-at-startup'), false)

  expect(Object.values(findToggles(wrapper)).map(toggle => toggle.disabled)).toEqual([true, true])
})

it('displays the error of the last action', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('plugin not configured'))
  const wrapper = mountToggles(createPlugin({ autoload: true }))

  await changeToggle(wrapper, t('load-at-startup'), false)
  await flushPromises()

  const alert = wrapper.get('.api-error-alert')

  expect(alert.text()).toContain(t('plugin:action-failed'))
  expect(alert.text()).toContain('plugin not configured')
})

it('displays no error before any action failed', () => {
  const wrapper = mountToggles()

  expect(wrapper.find('.api-error-alert').exists()).toBe(false)
})
