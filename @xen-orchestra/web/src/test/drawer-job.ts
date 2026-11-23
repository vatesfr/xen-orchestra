import { overlayMock } from '@/test/mock-overlay.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'

type DrawerOverlay = {
  events: {
    onConfirm: (payload: unknown) => Promise<unknown>
    onCancel: true
  }
}

type DrawerJobCase<TTarget> = {
  // How the test name calls what the job runs on
  subject: string
  createTarget: () => TTarget
  // Mounts the composable opening the drawer (the overlay of the mocked `use-overlay.ts`, see `mock-overlay.ts`)
  mount: (target?: TTarget) => void
  // The `run` spy of the job
  run: ReturnType<typeof vi.fn>
  // The target and the payload the job receives
  findJobArgs: () => { target: unknown; payload: unknown }
  payload: unknown
  // The error of a job failing
  errorMessage: string
}

/**
 * Registers the tests every composable running a job from the drawer it opens shares: the job runs on the target of
 * the composable, has a payload only once the drawer is confirmed, then runs with it and closes the drawer, which
 * stays open when the job fails, and closes when cancelled.
 */
export function itRunsJobFromDrawer<TTarget>({
  subject,
  createTarget,
  mount,
  run,
  findJobArgs,
  payload,
  errorMessage,
}: DrawerJobCase<TTarget>) {
  it(`runs on the ${subject}`, () => {
    const target = createTarget()
    mount(target)

    expect(findJobArgs().target).toEqual(target)
  })

  it('has no payload before the drawer is confirmed', () => {
    mount()

    expect(findJobArgs().payload).toBeUndefined()
  })

  it('closes the drawer when it is cancelled', () => {
    mount()

    expect(overlayMock.getOverlay<DrawerOverlay>().events.onCancel).toBe(true)
  })

  it('runs the job with the confirmed payload, then closes the drawer', async () => {
    run.mockImplementation(async () => expect(findJobArgs().payload).toEqual(payload))
    mount()

    const response = await overlayMock.getOverlay<DrawerOverlay>().events.onConfirm(payload)

    expect(run).toHaveBeenCalledOnce()
    expect(response).toBeUndefined()
  })

  it('keeps the drawer open when the job fails', async () => {
    run.mockRejectedValue(new Error(errorMessage))
    mount()

    const response = await overlayMock.getOverlay<DrawerOverlay>().events.onConfirm(payload)

    expect(response).toBe(KEEP_OVERLAY_OPEN)
  })
}
