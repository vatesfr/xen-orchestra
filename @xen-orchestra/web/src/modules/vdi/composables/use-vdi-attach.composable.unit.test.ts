import { type NewVbdPayload, useXoVbdCreateJob } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import VdiAttachDrawer from '@/modules/vdi/components/drawer/VdiAttachDrawer.vue'
import { useVdiAttach } from '@/modules/vdi/composables/use-vdi-attach.composable.ts'
import { createJobStub } from '@/test/create-job-result.ts'
import { createVm } from '@/test/create-vm.ts'
import { overlayMock, mockOverlay } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { VBD_MODE, type XoVdi } from '@vates/types'
import type { Component, Ref } from 'vue'

type OverlayOptions = {
  component: () => Promise<{ default: Component }>
  events: {
    onConfirm: (payload: NewVbdPayload) => unknown
    onCancel: true
  }
}

const createJob = createJobStub(useXoVbdCreateJob)
const { run } = createJob

mockOverlay()

const VM = createVm()

const PAYLOAD: NewVbdPayload = {
  VM: VM.id,
  VDI: 'vdi-1' as XoVdi['id'],
  mode: VBD_MODE.RW,
}

beforeEach(() => {
  createJob.reset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountVdiAttach() {
  return mountComposable(() => useVdiAttach(VM)).wrapper.vm
}

function getJobPayload() {
  return (createJob.use.mock.calls[0] as [Ref<NewVbdPayload | undefined>])[0]
}

function getOverlay() {
  return overlayMock.getOverlay<OverlayOptions>()
}

describe('isAttachingVdi', () => {
  it('is true while the attachment runs', () => {
    createJob.setState({ isRunning: true })

    expect(mountVdiAttach().isAttachingVdi).toBe(true)
  })
})

describe('openVdiAttachDrawer', () => {
  it('opens the VDI attach drawer on the VM', async () => {
    mountVdiAttach().openVdiAttachDrawer()

    expect((await getOverlay().component()).default).toBe(VdiAttachDrawer)
    expect(getOverlay().open.mock.lastCall?.[0].props).toEqual({ vm: VM })
  })
})

describe('onConfirm', () => {
  it('has no payload before the drawer is confirmed', () => {
    mountVdiAttach()

    expect(getJobPayload().value).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mountVdiAttach()

    expect(getOverlay().events.onCancel).toBe(true)
  })

  it('runs the job in the background with the confirmed payload, and closes the drawer', () => {
    run.mockImplementation(() => {
      expect(getJobPayload().value).toEqual(PAYLOAD)
    })
    mountVdiAttach().openVdiAttachDrawer()

    const response = getOverlay().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledExactlyOnceWith({ detached: true, onSuccess: expect.any(Function) })
    expect(response).toBeUndefined()
  })

  it('logs the failure when the attachment is rejected', () => {
    const consoleError = silenceConsoleError()
    run.mockImplementation(({ onSuccess }: { onSuccess: (results: PromiseSettledResult<unknown>[]) => void }) => {
      onSuccess([{ status: 'rejected', reason: new Error('Attachment failed') }])
    })
    mountVdiAttach().openVdiAttachDrawer()

    getOverlay().events.onConfirm(PAYLOAD)

    expect(consoleError).toHaveBeenCalledWith('Failed to attach VDI', new Error('Attachment failed'))
  })
})
