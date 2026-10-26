import { useXoPluginTest } from '@/modules/plugin/composables/use-xo-plugin-test.composable.ts'
import type { useXoPluginTestJob } from '@/modules/plugin/jobs/xo-plugin-test.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (testData: unknown) => Promise<unknown>
    onCancel: true
  }
}

const { useTestJob, run, useOverlayMock, open } = vi.hoisted(() => ({
  useTestJob: vi.fn(),
  run: vi.fn(),
  useOverlayMock: vi.fn(),
  open: vi.fn(),
}))

// The job tests the plugin through the REST API
vi.mock(import('@/modules/plugin/jobs/xo-plugin-test.job.ts'), () => ({
  useXoPluginTestJob: useTestJob as unknown as typeof useXoPluginTestJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

const TEST_DATA = { to: 'admin@example.org' }

beforeEach(() => {
  useTestJob.mockReset()
  run.mockReset()
  useOverlayMock.mockReset()
  open.mockReset()

  vi.spyOn(console, 'error').mockImplementation(() => {})

  useTestJob.mockReturnValue(createJobResult(run))
  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountTest(plugin: FrontXoPlugin = createPlugin({ testable: true })) {
  return mountComposable(() => useXoPluginTest(plugin)).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

function getJobArgs() {
  const [plugin, testData] = useTestJob.mock.calls[0] as [Ref<FrontXoPlugin>, Ref<unknown>]

  return { plugin, testData }
}

describe('job', () => {
  it('runs on the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack', testable: true })
    mountTest(plugin)

    expect(getJobArgs().plugin.value).toEqual(plugin)
  })

  it('has no test data before the drawer is confirmed', () => {
    mountTest()

    expect(getJobArgs().testData.value).toBeUndefined()
  })

  it('exposes whether the plugin can be tested, is being tested, and why it cannot be', () => {
    useTestJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountTest()

    expect(result.canTestPlugin).toBe(false)
    expect(result.isTestingPlugin).toBe(true)
    expect(result.testPluginErrorMessage).toBe('In progress')
  })
})

describe('testPlugin', () => {
  it('opens the drawer with the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack', testable: true })

    mountTest(plugin).testPlugin()

    expect(open).toHaveBeenCalledWith({ props: expect.objectContaining({ plugin }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountTest()

    expect(getOverlayOptions().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('tests the plugin with the confirmed data, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().testData.value).toEqual(TEST_DATA))
    mountTest()

    const response = await getOverlayOptions().events.onConfirm(TEST_DATA)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the test fails', async () => {
    run.mockRejectedValue(new Error('SMTP connection refused'))
    mountTest()

    const response = await getOverlayOptions().events.onConfirm(TEST_DATA)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
