import { isThenable } from '@core/packages/overlay/is-thenable.ts'
import { KEEP_OVERLAY_OPEN } from '@core/packages/overlay/symbols.ts'
import type { Overlay, OverlayEventHandler, OverlayResponse } from '@core/packages/overlay/types.ts'
import { nextTick } from 'vue'

export function createEventHandler({
  overlay,
  definitionEvents,
  openEvents,
  settle,
}: {
  overlay: Overlay
  definitionEvents: Record<string, true | OverlayEventHandler>
  openEvents: Record<string, OverlayEventHandler>
  settle: (response: OverlayResponse<PropertyKey, unknown>) => void
}) {
  const shouldStop = (payload: unknown) => payload === KEEP_OVERLAY_OPEN || overlay.status === 'settled'

  const runHandler = async (handler: OverlayEventHandler, handlerArgs: unknown[]) => {
    const result = handler(...handlerArgs)

    if (isThenable(result)) {
      overlay.status = 'busy'
    }

    return await result
  }

  return async function handleEvent(eventName: string, emitArgs: unknown[]) {
    if (overlay.status !== 'idle') {
      return
    }

    try {
      overlay.status = 'locked'

      // The definition handler receives the raw emit arguments, then the open
      // handler receives the payload it produced. An event handled at open
      // time only receives the raw emit arguments directly.
      let handlerArgs = emitArgs
      let payload: unknown

      const definitionHandler = definitionEvents[eventName]

      if (definitionHandler !== undefined) {
        payload = definitionHandler === true ? undefined : await runHandler(definitionHandler, handlerArgs)

        if (shouldStop(payload)) {
          return
        }

        handlerArgs = [payload]
      }

      const openHandler = openEvents[eventName]

      if (openHandler !== undefined) {
        payload = await runHandler(openHandler, handlerArgs)

        if (shouldStop(payload)) {
          return
        }
      }

      overlay.status = 'settled'

      // The leave transition freezes the DOM in its last painted state,
      // so paint a non-busy frame before removing the overlay
      await nextTick()

      settle({ event: eventName, payload })
    } finally {
      if (overlay.status !== 'settled') {
        overlay.status = 'idle'
      }

      overlay.lastTrigger = undefined
    }
  }
}
