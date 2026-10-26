import { useXoPluginConfigure } from '@/modules/plugin/composables/use-xo-plugin-configure.composable.ts'
import type { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (configuration: unknown) => Promise<unknown>
    onCancel: true
  }
}

const { useConfigureJob, run, useOverlayMock, open } = vi.hoisted(() => ({
  useConfigureJob: vi.fn(),
  run: vi.fn(),
  useOverlayMock: vi.fn(),
  open: vi.fn(),
}))

// The job saves the configuration through the REST API
vi.mock(import('@/modules/plugin/jobs/xo-plugin-configure.job.ts'), () => ({
  useXoPluginConfigureJob: useConfigureJob as unknown as typeof useXoPluginConfigureJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

const CONFIGURATION = { from: { address: 'xo@example.org' }, transport: { host: 'smtp.example.org' } }

beforeEach(() => {
  useConfigureJob.mockReset()
  run.mockReset()
  useOverlayMock.mockReset()
  open.mockReset()

  vi.spyOn(console, 'error').mockImplementation(() => {})

  useConfigureJob.mockReturnValue(createJobResult(run))
  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountConfigure(plugin: FrontXoPlugin = createPlugin()) {
  return mountComposable(() => useXoPluginConfigure(plugin)).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

function getJobArgs() {
  const [plugin, configuration] = useConfigureJob.mock.calls[0] as [Ref<FrontXoPlugin>, Ref<unknown>]

  return { plugin, configuration }
}

describe('job', () => {
  it('runs on the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack' })
    mountConfigure(plugin)

    expect(getJobArgs().plugin.value).toEqual(plugin)
  })

  it('has no configuration before the drawer is confirmed', () => {
    mountConfigure()

    expect(getJobArgs().configuration.value).toBeUndefined()
  })

  it('exposes whether the plugin can be configured, is being configured, and why it cannot be', () => {
    useConfigureJob.mockReturnValue(
      createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' })
    )

    const result = mountConfigure()

    expect(result.canConfigurePlugin).toBe(false)
    expect(result.isConfiguringPlugin).toBe(true)
    expect(result.configurePluginErrorMessage).toBe('In progress')
  })
})

describe('configurePlugin', () => {
  it('opens the drawer with the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack' })

    mountConfigure(plugin).configurePlugin()

    expect(open).toHaveBeenCalledWith({ props: expect.objectContaining({ plugin }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountConfigure()

    expect(getOverlayOptions().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('saves the confirmed configuration, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().configuration.value).toEqual(CONFIGURATION))
    mountConfigure()

    const response = await getOverlayOptions().events.onConfirm(CONFIGURATION)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the configuration is rejected', async () => {
    run.mockRejectedValue(new Error('Invalid configuration'))
    mountConfigure()

    const response = await getOverlayOptions().events.onConfirm(CONFIGURATION)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
