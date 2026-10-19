import { useXoPluginTest } from '@/modules/plugin/composables/use-xo-plugin-test.composable.ts'
import type { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { JsonSchema } from '@/modules/plugin/json-schema-form/json-schema.util.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, ref, toValue } from 'vue'

const { run, useTestJob } = vi.hoisted(() => ({
  run: vi.fn(),
  useTestJob: vi.fn(),
}))

vi.mock(import('@/modules/plugin/jobs/xo-plugin-test.job.ts'), () => ({
  useXoPluginTestJob: useTestJob as unknown as typeof useXoPluginTestJob,
}))

beforeEach(() => {
  run.mockReset().mockResolvedValue(undefined)
  useTestJob.mockReset().mockReturnValue({
    run,
    canRun: ref(true),
    isRunning: ref(false),
    errorMessage: ref(undefined),
  })
})

const testSchema = {
  type: 'object',
  properties: {
    to: { type: 'string' },
    subject: { type: 'string', default: 'Test' },
  },
  required: ['to'],
} satisfies JsonSchema

const testablePlugin = createPlugin({ testable: true, testSchema })

function mountTest(plugin: MaybeRefOrGetter<FrontXoPlugin>) {
  return mountComposable(() => useXoPluginTest(plugin)).wrapper.vm
}

describe('testData', () => {
  it('starts with the defaults of the test schema', () => {
    expect(mountTest(testablePlugin).testData).toEqual({ subject: 'Test' })
  })

  it('starts empty when the test schema has no defaults', () => {
    const plugin = createPlugin({
      testable: true,
      testSchema: { type: 'object', properties: { to: { type: 'string' } } },
    })

    expect(mountTest(plugin).testData).toEqual({})
  })

  it('is undefined when the plugin has no test schema', () => {
    expect(mountTest(createPlugin({ testable: true, testSchema: undefined })).testData).toBeUndefined()
  })

  it('is the data sent by the test', async () => {
    const result = mountTest(testablePlugin)
    result.testData = { to: 'admin@example.org' }

    await result.test()

    expect(toValue(useTestJob.mock.calls[0][1])).toEqual({ to: 'admin@example.org' })
  })
})

describe('test', () => {
  it('does not run the test while a required field is missing', async () => {
    const result = mountTest(testablePlugin)

    await result.test()

    expect({ runs: run.mock.calls.length, isSuccess: result.isSuccess }).toEqual({ runs: 0, isSuccess: false })
  })

  it('reports a successful test', async () => {
    const result = mountTest(testablePlugin)
    result.testData = { to: 'admin@example.org' }

    await result.test()

    expect({ isSuccess: result.isSuccess, error: result.error }).toEqual({ isSuccess: true, error: undefined })
  })

  it('keeps the error of a failed test', async () => {
    const error = new Error('email not sent')
    run.mockRejectedValue(error)
    const result = mountTest(testablePlugin)
    result.testData = { to: 'admin@example.org' }

    await result.test()

    expect({ isSuccess: result.isSuccess, error: result.error }).toEqual({ isSuccess: false, error })
  })

  it('runs the test of a plugin without test schema', async () => {
    const result = mountTest(createPlugin({ testable: true, testSchema: undefined }))

    await result.test()

    expect({ runs: run.mock.calls.length, isSuccess: result.isSuccess }).toEqual({ runs: 1, isSuccess: true })
  })

  it('clears the previous success when the next test is not run', async () => {
    const result = mountTest(testablePlugin)
    result.testData = { to: 'admin@example.org' }
    await result.test()
    result.testData = {}

    await result.test()

    expect(result.isSuccess).toBe(false)
  })
})
