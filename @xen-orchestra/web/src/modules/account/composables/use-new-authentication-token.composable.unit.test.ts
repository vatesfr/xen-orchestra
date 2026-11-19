import { useNewAuthenticationToken } from '@/modules/account/composables/use-new-authentication-token.composable.ts'
import type {
  NewAuthenticationTokenPayload,
  useXoAuthenticationTokenCreateJob,
} from '@/modules/account/jobs/xo-authentication-token-create.job.ts'
import { overlayMock } from '@/test/mock-overlay.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { silenceConsoleError } from '@/test/silence-console-error.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Ref } from 'vue'

type OverlayOptions = {
  events: {
    onConfirm: (payload: NewAuthenticationTokenPayload) => Promise<unknown>
    onCancel: true
  }
}

const { useCreateJob, run } = vi.hoisted(() => ({
  useCreateJob: vi.fn(),
  run: vi.fn(),
}))

vi.mock(import('@/modules/account/jobs/xo-authentication-token-create.job.ts'), () => ({
  useXoAuthenticationTokenCreateJob: useCreateJob as unknown as typeof useXoAuthenticationTokenCreateJob,
}))

vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))

const PAYLOAD: NewAuthenticationTokenPayload = { description: 'CI token' }

beforeEach(() => {
  useCreateJob.mockReset()
  run.mockReset()
  overlayMock.reset()

  silenceConsoleError()

  useCreateJob.mockReturnValue({ run })
})

function mountNewToken() {
  return mountComposable(() => useNewAuthenticationToken()).wrapper.vm
}

function getJobPayload() {
  return (useCreateJob.mock.calls[0] as [Ref<NewAuthenticationTokenPayload | undefined>])[0]
}

it('has no payload before the drawer is confirmed', () => {
  mountNewToken()

  expect(getJobPayload().value).toBeUndefined()
})

it('opens the drawer', () => {
  mountNewToken().openNewAuthenticationTokenDrawer()

  expect(overlayMock.getOverlay().open).toHaveBeenCalledOnce()
})

it('closes the drawer when it is cancelled', () => {
  mountNewToken()

  expect(overlayMock.getOverlay<OverlayOptions>().events.onCancel).toBe(true)
})

describe('onConfirm', () => {
  it('runs the job with the confirmed payload, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(getJobPayload().value).toEqual(PAYLOAD))
    mountNewToken()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error('Creation failed'))
    mountNewToken()

    const response = await overlayMock.getOverlay<OverlayOptions>().events.onConfirm(PAYLOAD)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
})
