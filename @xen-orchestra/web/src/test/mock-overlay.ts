import type { useOverlay as realUseOverlay } from '@core/packages/overlay/use-overlay.ts'

type OverlayOpen = ReturnType<typeof vi.fn>

type OverlayEvents = { onConfirm?: () => void }

type RecordedOverlay = Record<string, unknown> & { open: OverlayOpen }

const overlays: RecordedOverlay[] = []

/**
 * Runs the `onConfirm` event of the first of `modals` opened (overlays, or any modal mock with an `open` spy), given
 * when opening it or else declared with the modal.
 */
export function confirmOpenedModal(modals: { open: OverlayOpen; events?: OverlayEvents }[]) {
  const openedModal = modals.find(modal => modal.open.mock.calls.length > 0)

  const openEvents: OverlayEvents | undefined = openedModal?.open.mock.lastCall?.[0]?.events

  ;(openEvents?.onConfirm ?? openedModal?.events?.onConfirm)?.()
}

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
  // Runs the `onConfirm` event of the first overlay opened, see `confirmOpenedModal`
  confirmOpened() {
    confirmOpenedModal(this.getOverlays<{ events?: OverlayEvents }>())
  },
  reset() {
    overlays.length = 0
  },
}

// Use as `mockModule(import('@core/packages/overlay/use-overlay.ts'), () => import('@/test/mock-overlay.ts'))`
export const useOverlay = ((options: Record<string, unknown>) => {
  const open = vi.fn()

  overlays.push({ ...options, open })

  return { open, abort: vi.fn() }
}) as unknown as typeof realUseOverlay
