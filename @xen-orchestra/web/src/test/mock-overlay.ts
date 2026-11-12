import type { useOverlay as realUseOverlay } from '@core/packages/overlay/use-overlay.ts'

type OverlayOpen = ReturnType<typeof vi.fn>

type RecordedOverlay = Record<string, unknown> & { open: OverlayOpen }

const overlays: RecordedOverlay[] = []

// An overlay cannot be opened from a unit test: each `useOverlay` call is recorded here, in call order, as the options
// it was given and the `open` it got back. Reset it in `beforeEach`
export const overlayMock = {
  // `TOptions`: the options the caller passes, as the test reads them (its events typed for the payload they take)
  getOverlays<TOptions>() {
    return overlays as unknown as (TOptions & { open: OverlayOpen })[]
  },
  getOverlay<TOptions>(index = 0) {
    return this.getOverlays<TOptions>()[index]
  },
  reset() {
    overlays.length = 0
  },
}

// Use as `vi.mock(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))`
export const useOverlay = ((options: Record<string, unknown>) => {
  const open = vi.fn()

  overlays.push({ ...options, open })

  return { open, abort: vi.fn() }
}) as unknown as typeof realUseOverlay
