import PluginTestDrawer from '@/modules/plugin/components/drawer/PluginTestDrawer.vue'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsFormErrorSummary from '@core/components/form-error-summary/VtsFormErrorSummary.vue'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

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

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
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
  expect(
    mountDrawer()
      .findAll('.buttons button')
      .map(button => button.text())
  ).toEqual([t('cancel'), t('action:test')])
})

it('cancels from the cancel button', async () => {
  const wrapper = mountDrawer()

  await wrapper.get('.buttons button').trigger('click')

  expect(wrapper.emitted('cancel')).toHaveLength(1)
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('confirms with the data of the form when it is submitted', async () => {
  const wrapper = mountDrawer()

  await submit(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[{ to: 'admin@example.org' }]])
})

it('confirms without data when the test needs none', async () => {
  const wrapper = mountDrawer(createPlugin({ testable: true, testSchema: undefined }))

  await submit(wrapper)

  expect(wrapper.emitted('confirm')).toEqual([[undefined]])
})

it('lists the missing fields instead of confirming', async () => {
  const wrapper = mountDrawer(createPlugin({ testable: true, testSchema: REQUIRED_TEST_SCHEMA }))

  await submit(wrapper)

  expect(wrapper.emitted('confirm')).toBeUndefined()
  expect(wrapper.getComponent(VtsFormErrorSummary).props('errors')).toHaveLength(1)
})
