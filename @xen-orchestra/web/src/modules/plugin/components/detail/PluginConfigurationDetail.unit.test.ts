import PluginConfigurationDetail from '@/modules/plugin/components/detail/PluginConfigurationDetail.vue'
import JsonSchemaValue from '@/modules/plugin/components/json-schema-form/JsonSchemaValue.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin, PLUGIN_CONFIGURATION_SCHEMA } from '@/test/create-plugin.ts'
import { findTitles } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard(plugin: FrontXoPlugin) {
  return mount(PluginConfigurationDetail, { props: { plugin }, global: createGlobalTestConfig() })
}

it('titles the card as configuration', () => {
  const wrapper = mountCard(createPlugin())

  expect(findTitles(wrapper)).toEqual([t('configuration')])
})

it('shows the saved configuration of the plugin', () => {
  const plugin = createPlugin({
    configurationSchema: PLUGIN_CONFIGURATION_SCHEMA,
    configuration: { host: 'smtp.example.org' },
  })

  expect(mountCard(plugin).getComponent(JsonSchemaValue).props()).toEqual({
    schema: PLUGIN_CONFIGURATION_SCHEMA,
    value: { host: 'smtp.example.org' },
  })
})

it('explains that a plugin without schema is not configurable', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: undefined }))

  expect(wrapper.text()).toContain(t('plugin:not-configurable'))
  expect(wrapper.findComponent(JsonSchemaValue).exists()).toBe(false)
})
