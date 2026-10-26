import PluginTest from '@/modules/plugin/components/detail/PluginTest.vue'
import type { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import JsonSchemaField from '@/modules/plugin/json-schema-form/JsonSchemaField.vue'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { findTooltipContent } from '@/test/find-tooltip-content.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { toValue } from 'vue'

const { useTestJob, run } = vi.hoisted(() => ({
  useTestJob: vi.fn(),
  run: vi.fn(),
}))

// The job tests the plugin through the REST API
vi.mock(import('@/modules/plugin/jobs/xo-plugin-test.job.ts'), () => ({
  useXoPluginTestJob: useTestJob as unknown as typeof useXoPluginTestJob,
}))

beforeEach(() => {
  useTestJob.mockReset()
  run.mockReset()

  run.mockResolvedValue(undefined)
  useTestJob.mockReturnValue(createJobResult(run))
})

const TEST_SCHEMA = {
  type: 'object',
  properties: { to: { type: 'string', default: 'admin@example.org' } },
} satisfies JsonSchema

function createTestablePlugin(overrides: Parameters<typeof createPlugin>[0] = {}) {
  return createPlugin({ testable: true, loaded: true, ...overrides })
}

function mountCard(plugin = createTestablePlugin()) {
  return mount(PluginTest, { props: { plugin }, global: createGlobalTestConfig(), attachTo: document.body })
}

function findTestButton(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.get('.actions').getComponent(UiButton)
}

async function runTest(wrapper: ReturnType<typeof mountCard>) {
  await findTestButton(wrapper).trigger('click')
  await flushPromises()
}

function findInfos(wrapper: ReturnType<typeof mountCard>) {
  return wrapper.findAll('.ui-info').map(info => info.text())
}

// The job receives the data of the test as a getter
function findTestData() {
  return toValue(useTestJob.mock.lastCall?.[1])
}

it('explains what the test does', () => {
  const wrapper = mountCard()

  expect(findInfos(wrapper)).toEqual([t('plugin:test-info')])
})

it('displays a form for the data of the test', () => {
  const wrapper = mountCard(createTestablePlugin({ testSchema: TEST_SCHEMA }))

  expect(wrapper.getComponent(JsonSchemaField).props()).toMatchObject({
    schema: TEST_SCHEMA,
    label: t('test-data'),
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

  expect(run).toHaveBeenCalledOnce()
  expect(findTestData()).toEqual({ to: 'admin@example.org' })
})

it('focuses the first missing field instead of running the test', async () => {
  const wrapper = mountCard(
    createTestablePlugin({
      testSchema: { type: 'object', properties: { to: { type: 'string' } }, required: ['to'] },
    })
  )

  await runTest(wrapper)

  expect(document.activeElement).toBe(wrapper.get('input').element)
  expect(run).not.toHaveBeenCalled()
})

it('explains why the test cannot be run', async () => {
  useTestJob.mockReturnValue(createJobResult(run, { canRun: false, errorMessage: 'Plugin not loaded' }))
  const wrapper = mountCard()

  expect(findTestButton(wrapper).props('disabled')).toBe(true)
  expect(await findTooltipContent(findTestButton(wrapper).element)).toBe('Plugin not loaded')
})

it('has no tooltip when the test can be run', async () => {
  const wrapper = mountCard()

  expect(await findTooltipContent(findTestButton(wrapper).element)).toBe(false)
})

it('disables the form while the test is running', () => {
  useTestJob.mockReturnValue(createJobResult(run, { isRunning: true }))
  const wrapper = mountCard(createTestablePlugin({ testSchema: TEST_SCHEMA }))

  expect(wrapper.getComponent(JsonSchemaField).props('disabled')).toBe(true)
})

it('displays the success of the test', async () => {
  const wrapper = mountCard()

  await runTest(wrapper)

  expect(wrapper.get('.ui-alert').text()).toContain(t('plugin:test-success'))
})

it('displays the error of the test', async () => {
  run.mockRejectedValue(new Error('SMTP connection refused'))
  const wrapper = mountCard()

  await runTest(wrapper)

  const alert = wrapper.get('.api-error-alert')

  expect(alert.text()).toContain(t('plugin:test-failed'))
  expect(alert.text()).toContain('SMTP connection refused')
  expect(wrapper.text()).not.toContain(t('plugin:test-success'))
})
