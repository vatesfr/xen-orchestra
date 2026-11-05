import PluginConfigurationDrawer from '@/modules/plugin/components/drawer/PluginConfigurationDrawer.vue'
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { openSelect, pickSelectOption } from '@/test/select.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import { mount } from '@vue/test-utils'

const SCHEMA = {
  type: 'object',
  properties: {
    from: { type: 'object', properties: { address: { type: 'string' } }, required: ['address'] },
    transport: { type: 'object', properties: { host: { type: 'string' } }, required: ['host'] },
  },
  required: ['from', 'transport'],
} satisfies JsonSchema

const SAVED_CONFIGURATION = { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } }

const EDITED_CONFIGURATION = { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.com' } }

const GMAIL_PRESET = { from: { address: 'xo@gmail.com' }, transport: { host: 'smtp.gmail.com' } }

const configuredPlugin = createPlugin({ configurationSchema: SCHEMA, configuration: SAVED_CONFIGURATION })

function mountDrawer(plugin: FrontXoPlugin = configuredPlugin) {
  return mount(PluginConfigurationDrawer, {
    props: { plugin },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

it('edits the saved configuration in a required form', () => {
  expect(mountDrawer().getComponent(JsonSchemaField).props()).toMatchObject({
    schema: SCHEMA,
    modelValue: SAVED_CONFIGURATION,
    label: t('configuration'),
    required: true,
  })
})

it('offers the presets of the plugin', () => {
  const wrapper = mountDrawer(createPlugin({ ...configuredPlugin, configurationPresets: { gmail: GMAIL_PRESET } }))

  expect(wrapper.text()).toContain(t('plugin:configuration-presets'))
  expect(wrapper.text()).toContain(t('action:apply'))
})

it('fills the form with the applied preset', async () => {
  const wrapper = mountDrawer(createPlugin({ ...configuredPlugin, configurationPresets: { gmail: GMAIL_PRESET } }))

  await openSelect(wrapper)
  await pickSelectOption(wrapper, 'gmail')
  await getButton(wrapper, t('action:apply')).trigger('click')

  expect(wrapper.getComponent(JsonSchemaField).props('modelValue')).toEqual(GMAIL_PRESET)
})

it('offers no preset for a plugin without presets', () => {
  const wrapper = mountDrawer()

  expect(wrapper.text()).not.toContain(t('plugin:configuration-presets'))
  expect(wrapper.text()).not.toContain(t('action:apply'))
})

it('offers to cancel or to save', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:save')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the edited configuration when it is submitted', async () => {
  const wrapper = mountDrawer()
  await wrapper.getComponent(JsonSchemaField).setValue(EDITED_CONFIGURATION)

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[EDITED_CONFIGURATION]])
})

it('lists the missing fields instead of confirming', async () => {
  const wrapper = mountDrawer(createPlugin({ configurationSchema: SCHEMA, configuration: undefined }))

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(wrapper.getComponent(VtsFormErrorSummary).props('errors')).toHaveLength(2)
})
