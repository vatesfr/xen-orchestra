import PluginActions from '@/modules/plugin/components/actions/PluginActions.vue'
import PluginHeader from '@/modules/plugin/components/PluginHeader.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin, PLUGIN_CONFIGURATION_SCHEMA } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountHeader(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginHeader, {
    props: { plugin },
    global: { ...createGlobalTestConfig(), stubs: { PluginActions: true } },
  })
}

function findTags(wrapper: ReturnType<typeof mountHeader>) {
  return wrapper.findAll('.ui-head-bar .ui-tag').map(tag => ({
    text: tag.text(),
    accent: tag
      .classes()
      .find(className => className.startsWith('accent--'))
      ?.replace('accent--', ''),
  }))
}

it('shows the name of the plugin in the head bar', () => {
  const wrapper = mountHeader(createPlugin())

  expect(wrapper.get('.ui-head-bar .label').text()).toBe('transport-email')
})

it('lists the plugins then the plugin in the breadcrumb', () => {
  const wrapper = mountHeader(createPlugin())

  expect(wrapper.findAll('.ui-breadcrumb li').map(item => item.text())).toEqual([t('plugins'), 'transport-email'])
})

it('links the breadcrumb back to the list of plugins', () => {
  const wrapper = mountHeader()

  expect(wrapper.get('.ui-breadcrumb a.ui-link').attributes('href')).toBe('/admin/plugins')
})

it('shows the version and the configuration status of a configured plugin', () => {
  const wrapper = mountHeader(
    createPlugin({ version: '2.1.0', configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: true })
  )

  expect(findTags(wrapper)).toEqual([
    { text: t('version-number', { version: '2.1.0' }), accent: 'neutral' },
    { text: t('status:configured'), accent: 'success' },
  ])
})

it('warns about a plugin which is not configured', () => {
  const wrapper = mountHeader(createPlugin({ configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: false }))

  expect(findTags(wrapper).at(-1)).toEqual({ text: t('status:not-configured'), accent: 'warning' })
})

it('shows no configuration status for a plugin which is not configurable', () => {
  const wrapper = mountHeader(createPlugin({ version: '2.1.0', configurationSchema: undefined }))

  expect(findTags(wrapper)).toEqual([{ text: t('version-number', { version: '2.1.0' }), accent: 'neutral' }])
})

it('shows no version for a plugin without version', () => {
  const wrapper = mountHeader(createPlugin({ version: undefined, configurationSchema: undefined }))

  expect(findTags(wrapper)).toEqual([])
})

it('displays the actions of the plugin', () => {
  const plugin = createPlugin()
  const wrapper = mountHeader(plugin)

  expect(wrapper.getComponent(PluginActions).props('plugin')).toEqual(plugin)
})
