import PluginTest from '@/modules/plugin/components/detail/PluginTest.vue'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import type { useXoTaskCollection } from '@/modules/task/remote-resources/use-xo-task-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useTooltipStore } from '@core/stores/tooltip.store.ts'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'

vi.mock(import('@/modules/task/remote-resources/use-xo-task-collection.ts'), async () => {
  const { ref } = await import('vue')

  return {
    useXoTaskCollection: (() => ({
      useGetTaskById: () => ref({ status: 'success' }),
    })) as unknown as typeof useXoTaskCollection,
  }
})

beforeEach(() => {
  vi.mocked(fetch).mockReset()
})

const TEST_SCHEMA = {
  type: 'object',
  properties: { to: { type: 'string', default: 'admin@example.org' } },
} satisfies JsonSchema

function createTestablePlugin(overrides: Parameters<typeof createPlugin>[0] = {}) {
  return createPlugin({ testable: true, loaded: true, ...overrides })
}

function mountCard(plugin = createTestablePlugin()) {
  return mount(PluginTest, { props: { plugin }, global: createGlobalTestConfig() })
}

function findTestButton(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.get('.actions').getComponent(UiButton)
}

async function runTest(wrapper: ReturnType<typeof mountCard>) {
  await findTestButton(wrapper).trigger('click')
  await flushPromises()
}

async function findTestButtonTooltip(wrapper: ReturnType<typeof mountCard>) {
  const button = findTestButton(wrapper).element
  // `trigger` ignores disabled elements
  button.dispatchEvent(new MouseEvent('mouseenter'))
  await nextTick()

  return useTooltipStore().tooltips.find(tooltip => tooltip.target === button)?.options.content
}

function findInfos(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.ui-info').map(info => info.text())
}

function findRequests() {
  return vi.mocked(fetch).mock.calls.map(([url, init]) => ({ url, method: init?.method, body: init?.body }))
}

it('explains what the test does', () => {
  const wrapper = mountCard()

  expect(findInfos(wrapper)).toEqual([t('plugin:test-info')])
})

it('displays a form for the data of the test', () => {
  const wrapper = mountCard(createTestablePlugin({ testSchema: TEST_SCHEMA }))

  expect(wrapper.getComponent(JsonSchemaField).props()).toMatchObject({
    schema: TEST_SCHEMA,
    label: t('plugin:test-data'),
    required: true,
    disabled: false,
  })
})

it('displays no form when the test needs no data', () => {
  const wrapper = mountCard(createTestablePlugin({ testSchema: undefined }))

  expect(wrapper.findComponent(JsonSchemaField).exists()).toBe(false)
})

it('runs the test with the data of the form', async () => {
  const wrapper = mountCard(createTestablePlugin({ testSchema: TEST_SCHEMA }))

  await findTestButton(wrapper).trigger('click')

  expect(findRequests()).toEqual([
    {
      url: '/rest/v0/plugins/transport-email/actions/test',
      method: 'POST',
      body: JSON.stringify({ data: { to: 'admin@example.org' } }),
    },
  ])
})

it('focuses the first missing field instead of running the test', async () => {
  const wrapper = mount(PluginTest, {
    props: {
      plugin: createTestablePlugin({
        testSchema: { type: 'object', properties: { to: { type: 'string' } }, required: ['to'] },
      }),
    },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })

  await runTest(wrapper)

  expect({ focused: document.activeElement, requests: findRequests() }).toEqual({
    focused: wrapper.get('input').element,
    requests: [],
  })
  wrapper.unmount()
})

it('explains why the test cannot be run', async () => {
  const wrapper = mountCard(createTestablePlugin({ loaded: false }))

  expect({
    disabled: findTestButton(wrapper).props('disabled'),
    tooltip: await findTestButtonTooltip(wrapper),
  }).toEqual({
    disabled: true,
    tooltip: t('job:plugin-test:not-loaded'),
  })
})

it('has no tooltip when the test can be run', async () => {
  const wrapper = mountCard()

  expect(await findTestButtonTooltip(wrapper)).toBe(false)
})

it('disables the form while the test is running', async () => {
  const wrapper = mountCard(createTestablePlugin({ testSchema: TEST_SCHEMA }))

  await findTestButton(wrapper).trigger('click')

  expect(wrapper.getComponent(JsonSchemaField).props('disabled')).toBe(true)
})

it('displays the success of the test', async () => {
  vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ taskId: 'task-1' })))
  const wrapper = mountCard()

  await runTest(wrapper)

  expect(wrapper.get('.ui-alert').text()).toContain(t('plugin:test-success'))
})

it('displays the error of the test', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('SMTP connection refused'))
  const wrapper = mountCard()

  await runTest(wrapper)

  const alert = wrapper.get('.api-error-alert')

  expect(alert.text()).toContain(t('plugin:test-failed'))
  expect(alert.text()).toContain('SMTP connection refused')
  expect(wrapper.text()).not.toContain(t('plugin:test-success'))
})
