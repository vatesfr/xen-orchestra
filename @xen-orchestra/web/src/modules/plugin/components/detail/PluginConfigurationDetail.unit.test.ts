import PluginConfigurationDetail from '@/modules/plugin/components/detail/PluginConfigurationDetail.vue'
import JsonSchemaValue from '@/modules/plugin/json-schema-form/JsonSchemaValue.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const SCHEMA = { type: 'object', properties: { host: { type: 'string' } } } as const

function mountCard(plugin: FrontXoPlugin) {
  return mount(PluginConfigurationDetail, { props: { plugin }, global: createGlobalTestConfig() })
}

it('titles the card as configuration', () => {
  const wrapper = mountCard(createPlugin())

  expect(wrapper.findAll('.ui-title').map(title => title.text())).toEqual([t('configuration')])
})

it('shows the saved configuration of the plugin', () => {
  const plugin = createPlugin({ configurationSchema: SCHEMA, configuration: { host: 'smtp.example.org' } })

  expect(mountCard(plugin).getComponent(JsonSchemaValue).props()).toEqual({
    schema: SCHEMA,
    value: { host: 'smtp.example.org' },
  })
})

it('explains that a plugin without schema is not configurable', () => {
  const wrapper = mountCard(createPlugin({ configurationSchema: undefined }))

  expect(wrapper.text()).toContain(t('plugin:not-configurable'))
  expect(wrapper.findComponent(JsonSchemaValue).exists()).toBe(false)
})
