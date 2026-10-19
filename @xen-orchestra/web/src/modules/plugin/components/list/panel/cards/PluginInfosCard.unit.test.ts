import PluginInfosCard from '@/modules/plugin/components/list/panel/cards/PluginInfosCard.vue'
import PluginStateToggles from '@/modules/plugin/components/PluginStateToggles.vue'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createTestRouter } from '@/test/create-test-router.ts'
import { findCardLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import type { Router } from 'vue-router'

const CONFIGURATION_SCHEMA = { type: 'object', properties: { host: { type: 'string' } } } satisfies JsonSchema

function mountCard(plugin: FrontXoPlugin = createPlugin(), router?: Router) {
  return mount(PluginInfosCard, {
    props: { plugin },
    global: { ...createGlobalTestConfig({ router }), stubs: { PluginStateToggles: true } },
  })
}

it('shows the information of the plugin', () => {
  const wrapper = mountCard(
    createPlugin({
      version: '2.1.0',
      description: 'Send emails',
      keywords: ['email'],
      configurationSchema: CONFIGURATION_SCHEMA,
      configured: true,
    })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('version')]: '2.1.0',
    [t('description')]: 'Send emails',
    [t('keywords')]: 'email',
    [t('configuration')]: t('status:configured'),
  })
})

it.each([{ keywords: [] }, { keywords: undefined }])(
  'hides the keywords of a plugin with $keywords as keywords',
  ({ keywords }) => {
    const wrapper = mountCard(createPlugin({ keywords }))

    expect(Object.keys(findCardLabelledValues(wrapper))).not.toContain(t('keywords'))
  }
)

it('shows that a plugin without configuration schema is not configurable', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: undefined }))

  expect(findCardLabelledValues(wrapper)[t('configuration')]).toBe(t('plugin:not-configurable'))
})

it('links the title to the page of the plugin', () => {
  const wrapper = mountCard(createPlugin())

  expect(wrapper.get('.ui-panel-card-title a').attributes('href')).toBe('/admin/plugin/transport-email')
})

it('displays the state toggles of the plugin', () => {
  const plugin = createPlugin()
  const wrapper = mountCard(plugin)

  expect(wrapper.getComponent(PluginStateToggles).props()).toMatchObject({ plugin, vertical: true })
})

describe('configured plugin', () => {
  it('shows no warning', () => {
    const wrapper = mountCard(createPlugin({ configurationSchema: CONFIGURATION_SCHEMA, configured: true }))

    expect(wrapper.find('.ui-alert').exists()).toBe(false)
  })

  it('offers to open the page of the plugin', () => {
    const wrapper = mountCard(createPlugin({ configured: true }))

    expect(wrapper.get('.open-button').text()).toBe(t('plugin:open-page'))
  })
})

describe('plugin which is not configured', () => {
  function mountUnconfiguredCard(router?: Router) {
    return mountCard(
      createPlugin({
        configurationSchema: CONFIGURATION_SCHEMA,
        configured: false,
      }),
      router
    )
  }

  it('warns that it needs to be configured', () => {
    const wrapper = mountUnconfiguredCard()

    expect(wrapper.get('.ui-alert').text()).toContain(t('plugin:needs-configuration-short'))
  })

  it('offers to configure it', () => {
    const wrapper = mountUnconfiguredCard()

    expect(wrapper.get('.open-button').text()).toBe(t('action:configure'))
  })

  it('opens the page of the plugin to configure it', async () => {
    const router = createTestRouter()
    const wrapper = mountUnconfiguredCard(router)

    await wrapper.get('.open-button').trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/admin/plugin/transport-email'))
  })
})
