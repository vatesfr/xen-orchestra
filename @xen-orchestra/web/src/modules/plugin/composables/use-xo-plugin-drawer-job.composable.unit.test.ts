import { useXoPluginDrawerJob } from '@/modules/plugin/composables/use-xo-plugin-drawer-job.composable.ts'
import type { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { itRunsJobFromDrawer } from '@/test/drawer-job.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import type { Ref } from 'vue'

type OverlayOptions = { component: unknown }

const useJob = vi.fn()
const run = vi.fn()
const drawer = vi.fn()

mockOverlay()

const PAYLOAD = { to: 'admin@example.org' }

beforeEach(() => {
  useJob.mockReset()
  run.mockReset()
  overlayMock.reset()

  silenceConsoleError()

  useJob.mockReturnValue(createJobResult(run))
})

function mountDrawerJob(plugin: FrontXoPlugin = createPlugin()) {
  return mountComposable(() =>
    useXoPluginDrawerJob(plugin, { useJob: useJob as unknown as typeof useXoPluginConfigureJob, drawer })
  ).wrapper.vm
}

function findJobArgs() {
  const [plugin, payload] = useJob.mock.calls[0] as [Ref<FrontXoPlugin>, Ref<unknown>]

  return { target: plugin.value, payload: payload.value }
}

describe('job', () => {
  it('exposes whether the job can run, is running, and why it cannot run', () => {
    useJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    expect(mountDrawerJob()).toMatchObject({ canRun: false, isRunning: true, errorMessage: 'In progress' })
  })
})

describe('openDrawer', () => {
  it('opens the given drawer with the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack' })

    mountDrawerJob(plugin).openDrawer()

    expect(overlayMock.getOverlay<OverlayOptions>().component).toBe(drawer)
    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ plugin }) })
  })
})

describe('drawer', () => {
  itRunsJobFromDrawer({
    subject: 'plugin',
    createTarget: () => createPlugin({ name: 'transport-slack' }),
    mount: mountDrawerJob,
    run,
    findJobArgs,
    payload: PAYLOAD,
    errorMessage: 'SMTP connection refused',
  })
})
