import PluginTestDrawer from '@/modules/plugin/components/drawer/PluginTestDrawer.vue'
import JsonSchemaField from '@/modules/plugin/components/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import type { JsonSchema } from '@/modules/plugin/utils/json-schema.util.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import { mount } from '@vue/test-utils'

const TEST_SCHEMA = {
  type: 'object',
  properties: { to: { type: 'string', default: 'admin@example.org' } },
} satisfies JsonSchema

const REQUIRED_TEST_SCHEMA = {
  type: 'object',
  properties: { to: { type: 'string' } },
  required: ['to'],
} satisfies JsonSchema

function mountDrawer(plugin: FrontXoPlugin = createPlugin({ testable: true, testSchema: TEST_SCHEMA })) {
  return mount(PluginTestDrawer, {
    props: { plugin },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
}

it('explains what the test does', () => {
  expect(mountDrawer().get('.ui-info').text()).toBe(t('plugin:test-info'))
})

it('displays a required form for the data of the test', () => {
  expect(mountDrawer().getComponent(JsonSchemaField).props()).toMatchObject({
    schema: TEST_SCHEMA,
    modelValue: { to: 'admin@example.org' },
    label: t('test-data'),
    required: true,
  })
})

it('displays no form when the test needs no data', () => {
  const wrapper = mountDrawer(createPlugin({ testable: true, testSchema: undefined }))

  expect(wrapper.findComponent(JsonSchemaField).exists()).toBe(false)
})

it('offers to cancel or to test', () => {
  expect(findDrawerButtonLabels(mountDrawer())).toEqual([t('cancel'), t('action:test')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the data of the form when it is submitted', async () => {
  const wrapper = mountDrawer()

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ to: 'admin@example.org' }]])
})

it('confirms without data when the test needs none', async () => {
  const wrapper = mountDrawer(createPlugin({ testable: true, testSchema: undefined }))

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[undefined]])
})

it('lists the missing fields instead of confirming', async () => {
  const wrapper = mountDrawer(createPlugin({ testable: true, testSchema: REQUIRED_TEST_SCHEMA }))

  await submitDrawer(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(wrapper.getComponent(VtsFormErrorSummary).props('errors')).toHaveLength(1)
})
