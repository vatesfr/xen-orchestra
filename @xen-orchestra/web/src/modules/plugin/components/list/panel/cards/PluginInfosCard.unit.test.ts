import PluginInfosCard from '@/modules/plugin/components/list/panel/cards/PluginInfosCard.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin, PLUGIN_CONFIGURATION_SCHEMA } from '@/test/create-plugin.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginInfosCard, {
    props: { plugin },
    global: createGlobalTestConfig(),
  })
}

it('shows the information of the plugin', () => {
  const wrapper = mountCard(
    createPlugin({
      version: '2.1.0',
      description: 'Send emails',
      keywords: ['email'],
      configurationSchema: PLUGIN_CONFIGURATION_SCHEMA,
      configured: true,
      loaded: true,
      autoload: false,
    })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('version')]: '2.1.0',
    [t('description')]: 'Send emails',
    [t('keywords')]: 'email',
    [t('configuration')]: t('status:configured'),
    [t('loaded')]: t('enabled'),
    [t('load-at-startup')]: t('disabled'),
  })
})

it('shows a plugin never loaded as not loaded', () => {
  const wrapper = mountCard(createPlugin({ loaded: undefined }))

  expect(findCardLabelledValues(wrapper)[t('loaded')]).toBe(t('disabled'))
})

it('copies the version and the description of the plugin', () => {
  const wrapper = mountCard(createPlugin({ version: '2.1.0', description: '  Send emails\n' }))

  expect(findCardCopiedValues(wrapper)).toEqual(['2.1.0', 'Send emails'])
})

it.each([{ description: undefined }, { description: ' \n' }])(
  'copies nothing for a plugin without version and with $description as description',
  ({ description }) => {
    const wrapper = mountCard(createPlugin({ version: undefined, description }))

    expect(findCardCopiedValues(wrapper)).toEqual([])
  }
)

it('hides the keywords of a plugin without keywords', () => {
  const wrapper = mountCard(createPlugin({ keywords: [] }))

  expect(Object.keys(findCardLabelledValues(wrapper))).not.toContain(t('keywords'))
})

it('shows that a plugin without configuration schema is not configurable', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: undefined }))

  expect(findCardLabelledValues(wrapper)[t('configuration')]).toBe(t('plugin:not-configurable'))
})

it('links the title to the page of the plugin', () => {
  const wrapper = mountCard(createPlugin())

  expect(wrapper.get('.ui-panel-card-title a').attributes('href')).toBe('/admin/plugin/transport-email')
})

it('shows no warning for a configured plugin', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: true }))

  expect(wrapper.find('.ui-alert').exists()).toBe(false)
})

it('warns that a plugin which is not configured needs to be configured', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: false }))

  expect(wrapper.get('.ui-alert').text()).toContain(t('plugin:needs-configuration-short'))
})
