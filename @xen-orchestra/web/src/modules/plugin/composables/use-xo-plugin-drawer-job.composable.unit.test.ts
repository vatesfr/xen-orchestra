import { useXoPluginDrawerJob } from '@/modules/plugin/composables/use-xo-plugin-drawer-job.composable.ts'
import type { useXoPluginConfigureJob } from '@/modules/plugin/jobs/xo-plugin-configure.job.ts'
import type { FrontXoPlugin } from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { createPlugin } from '@/test/create-plugin.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import type { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  component: unknown
  events: {
    onConfirm: (payload: unknown) => Promise<unknown>
    onCancel: true
  }
}

const { useJob, run, useOverlayMock, open, drawer } = vi.hoisted(() => ({
  useJob: vi.fn(),
  run: vi.fn(),
  useOverlayMock: vi.fn(),
  open: vi.fn(),
  drawer: vi.fn(),
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => ({
  useOverlay: useOverlayMock as unknown as typeof useOverlay,
}))

const PAYLOAD = { to: 'admin@example.org' }

beforeEach(() => {
  useJob.mockReset()
  run.mockReset()
  useOverlayMock.mockReset()
  open.mockReset()

  vi.spyOn(console, 'error').mockImplementation(() => {})

  useJob.mockReturnValue(createJobResult(run))
  useOverlayMock.mockReturnValue({ open, abort: vi.fn() })
})

function mountDrawerJob(plugin: FrontXoPlugin = createPlugin()) {
  return mountComposable(() =>
    useXoPluginDrawerJob(plugin, { useJob: useJob as unknown as typeof useXoPluginConfigureJob, drawer })
  ).wrapper.vm
}

function getOverlayOptions(): OverlayOptions {
  return useOverlayMock.mock.calls[0][0]
}

function getJobArgs() {
  const [plugin, payload] = useJob.mock.calls[0] as [Ref<FrontXoPlugin>, Ref<unknown>]

  return { plugin, payload }
}

describe('job', () => {
  it('runs on the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack' })
    mountDrawerJob(plugin)

    expect(getJobArgs().plugin.value).toEqual(plugin)
  })

  it('has no payload before the drawer is confirmed', () => {
    mountDrawerJob()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('exposes whether the job can run, is running, and why it cannot run', () => {
    useJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    expect(mountDrawerJob()).toMatchObject({ canRun: false, isRunning: true, errorMessage: 'In progress' })
  })
})

describe('openDrawer', () => {
  it('opens the given drawer with the plugin', () => {
    const plugin = createPlugin({ name: 'transport-slack' })

    mountDrawerJob(plugin).openDrawer()

    expect(getOverlayOptions().component).toBe(drawer)
    expect(open).toHaveBeenCalledWith({ props: expect.objectContaining({ plugin }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountDrawerJob()

    expect(getOverlayOptions().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual(PAYLOAD))
    mountDrawerJob()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('SMTP connection refused'))
    mountDrawerJob()

    const response = await getOverlayOptions().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
