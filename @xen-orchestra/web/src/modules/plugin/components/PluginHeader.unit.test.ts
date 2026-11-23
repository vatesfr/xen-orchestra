import PluginActions from '@/modules/plugin/components/actions/PluginActions.vue'
import PluginHeader from '@/modules/plugin/components/PluginHeader.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin, PLUGIN_CONFIGURATION_SCHEMA } from '@/test/create-plugin.ts'
import { findBreadcrumbItems, findBreadcrumbLink, findHeadBarLabel } from '@/test/find-header.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { findAccentedTags } from '@core-test/find-accented-labels.ts'
import { mount } from '@vue/test-utils'

function mountHeader(plugin: FrontXoPlugin = createPlugin()) {
  return mount(PluginHeader, {
    props: { plugin },
    global: { ...createGlobalTestConfig(), stubs: { PluginActions: true } },
  })
}

it('shows the name of the plugin in the head bar', () => {
  const wrapper = mountHeader(createPlugin())

  expect(findHeadBarLabel(wrapper)).toBe('transport-email')
})

it('lists the plugins then the plugin in the breadcrumb', () => {
  const wrapper = mountHeader(createPlugin())

  expect(findBreadcrumbItems(wrapper).map(item => item.text())).toEqual([t('plugins'), 'transport-email'])
})

it('links the breadcrumb back to the list of plugins', () => {
  expect(findBreadcrumbLink(mountHeader())).toBe('/admin/plugins')
})

it('shows the version and the configuration status of a configured plugin', () => {
  const wrapper = mountHeader(
    createPlugin({ version: '2.1.0', configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: true })
  )

  expect(findAccentedTags(wrapper)).toEqual([
    { label: t('version-number', { version: '2.1.0' }), accent: 'neutral' },
    { label: t('status:configured'), accent: 'success' },
  ])
})

it('warns about a plugin which is not configured', () => {
  const wrapper = mountHeader(createPlugin({ configurationSchema: PLUGIN_CONFIGURATION_SCHEMA, configured: false }))

  expect(findAccentedTags(wrapper).at(-1)).toEqual({ label: t('status:not-configured'), accent: 'warning' })
})

it('shows no configuration status for a plugin which is not configurable', () => {
  const wrapper = mountHeader(createPlugin({ version: '2.1.0', configurationSchema: undefined }))

  expect(findAccentedTags(wrapper)).toEqual([{ label: t('version-number', { version: '2.1.0' }), accent: 'neutral' }])
})

it('shows no version for a plugin without version', () => {
  const wrapper = mountHeader(createPlugin({ version: undefined, configurationSchema: undefined }))

  expect(findAccentedTags(wrapper)).toEqual([])
})

it('displays the actions of the plugin', () => {
  const plugin = createPlugin()
  const wrapper = mountHeader(plugin)

  expect(wrapper.getComponent(PluginActions).props('plugin')).toEqual(plugin)
})
