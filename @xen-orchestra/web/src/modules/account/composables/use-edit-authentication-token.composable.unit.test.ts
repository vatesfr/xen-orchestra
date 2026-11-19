import { useEditAuthenticationToken } from '@/modules/account/composables/use-edit-authentication-token.composable.ts'
import type {
  EditAuthenticationTokenPayload,
  useXoAuthenticationTokenEditJob,
} from '@/modules/account/jobs/xo-authentication-token-edit.job.ts'
import { createAuthenticationToken } from '@/test/create-authentication-token.ts'
import { createJobResult } from '@/test/create-job-result.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { XoAuthenticationToken } from '@vates/types'
import { type Ref, ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: EditAuthenticationTokenPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useEditJob, run } = vi.hoisted(() => ({
  useEditJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-authentication-token-edit.job.ts'), () => ({
  useXoAuthenticationTokenEditJob: useEditJob as unknown as typeof useXoAuthenticationTokenEditJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const PAYLOAD: EditAuthenticationTokenPayload = { description: 'CI token' }

beforeEach(() => {
  useEditJob.mockReset().mockReturnValue(createJobResult(run))
  run.mockReset()
  overlayMock.reset()

  silenceConsoleError()
})

function mountEditToken(token: XoAuthenticationToken = createAuthenticationToken()) {
  return mountComposable(() => useEditAuthenticationToken(token)).wrapper.vm
}

function getJobArgs() {
  const [token, payload] = useEditJob.mock.calls[0] as [
    Ref<XoAuthenticationToken>,
    Ref<EditAuthenticationTokenPayload | undefined>,
  ]

  return { token, payload }
}

describe('job', () => {
  it('runs on the token', () => {
    const token = createAuthenticationToken({ description: 'Old description' })
    mountEditToken(token)

    expect(getJobArgs().token.value).toEqual(token)
  })

  it('has no payload before the drawer is confirmed', () => {
    mountEditToken()

    expect(getJobArgs().payload.value).toBeUndefined()
  })

  it('exposes whether the token can be edited, is being edited, and why it cannot be', () => {
    useEditJob.mockReturnValue(createJobResult(run, { canRun: false, isRunning: true, errorMessage: 'In progress' }))

    const result = mountEditToken()

    expect(result.canEditAuthenticationToken).toBe(false)
    expect(result.isEditingAuthenticationToken).toBe(true)
    expect(result.editAuthenticationTokenErrorMessage).toBe('In progress')
  })
})

describe('editAuthenticationToken', () => {
  it('opens the drawer with the token', () => {
    const token = createAuthenticationToken({ description: 'Old description' })

    mountEditToken(token).editAuthenticationToken()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ token }) })
  })

  it('opens the drawer with the latest token', () => {
    const token = ref(createAuthenticationToken())
    const { wrapper } = mountComposable(() => useEditAuthenticationToken(token))
    const updatedToken = createAuthenticationToken({ description: 'New description' })

    token.value = updatedToken
    wrapper.vm.editAuthenticationToken()

    expect(overlayMock.getOverlay().open).toHaveBeenCalledWith({ props: expect.objectContaining({ token: updatedToken }) })
  })

  it('closes the drawer when it is cancelled', () => {
    mountEditToken()

    expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
  })
})

describe('onConfirm', () => {
  it('runs the job with the confirmed description only, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobArgs().payload.value).toEqual(PAYLOAD))
    mountEditToken()

    const response = await overlayMock
      .getOverlay<OverlayOptions>()
      .events.onConfirm({ ...PAYLOAD, expiration: 1 } as EditAuthenticationTokenPayload)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Edition failed'))
    mountEditToken()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
