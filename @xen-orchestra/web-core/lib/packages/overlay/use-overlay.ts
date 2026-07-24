import { createEventHandler } from '@core/packages/overlay/create-event-handler.ts'
import { OVERLAY_ABORT_EVENT } from '@core/packages/overlay/symbols.ts'
import type {
  ExtractOverlayResponse,
  ForbidExtraEvents,
  MaybeOptionalArgs,
  MaybeOptionalKey,
  OpenEvents,
  Overlay,
  OverlayEventHandler,
  OverlayEvents,
  Prettify,
} from '@core/packages/overlay/types.ts'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { reactiveComputed } from '@vueuse/core'
import { defineAsyncComponent, markRaw, nextTick, reactive, type AsyncComponentLoader, type Component } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

export function useOverlay<TComponent extends Component, const TEvents extends OverlayEvents<TComponent>>({
  component: componentLoader,
  events,
}: {
  component: AsyncComponentLoader<TComponent>
  events: TEvents & NoInfer<ForbidExtraEvents<TComponent, TEvents>>
}) {
  const overlayStore = useOverlayStore()

  const key = Symbol('new-overlay')

  const component = defineAsyncComponent(componentLoader)

  let currentOverlay: Overlay | undefined

  function abort() {
    currentOverlay?.abort()
  }

  function open<TOpenEvents extends OpenEvents<TComponent, TEvents>>(
    ...args: MaybeOptionalArgs<
      Prettify<
        { events?: TOpenEvents & NoInfer<ForbidExtraEvents<TComponent, TOpenEvents>> } & MaybeOptionalKey<
          'props',
          ComponentProps<TComponent>
        >
      >
    >
  ) {
    const { events: openEvents, props } = args[0] ?? {}

    abort()

    return new Promise<ExtractOverlayResponse<TComponent, TEvents, TOpenEvents>>(resolve => {
      const definitionEvents = events as Record<string, true | OverlayEventHandler>
      const perOpenEvents = (openEvents ?? {}) as Record<string, OverlayEventHandler>

      // A new object per `open()` call, so that a pending async handler of a
      // replaced overlay cannot interfere with the one currently displayed
      const overlay = reactive<Overlay>({
        key,
        component: markRaw(component),
        props: {},
        status: 'idle',
        lastTrigger: undefined,
        abort: () => settle({ event: OVERLAY_ABORT_EVENT, payload: undefined }),
      })

      currentOverlay = overlay

      async function settle(response: ExtractOverlayResponse<TComponent, TEvents, TOpenEvents>) {
        if (overlay.status === 'settled') {
          return
        }

        overlay.status = 'settled'

        // The `leave` transition freezes the DOM in its last painted state,
        // so paint a non-busy frame before removing the overlay
        await nextTick()

        resolve(response)

        overlayStore.unregister(overlay)
      }

      const handleEvent = createEventHandler({
        overlay,
        definitionEvents,
        openEvents: perOpenEvents,
        settle: response => settle(response as ExtractOverlayResponse<TComponent, TEvents, TOpenEvents>),
      })

      // Merge all props + events. If an event is provided in both, the `events`
      // handler runs first, then the `openEvents` one, if needed.
      const eventProps: Record<string, OverlayEventHandler> = {}

      const eventNames = new Set([...Object.keys(definitionEvents), ...Object.keys(perOpenEvents)])

      eventNames.forEach(eventName => {
        eventProps[eventName] = (...emitArgs: unknown[]) => handleEvent(eventName, emitArgs)
      })

      // `reactiveComputed` keeps the merged props live when a reactive `props` object is passed
      overlay.props = reactiveComputed(() => ({ ...(props as Record<string, unknown> | undefined), ...eventProps }))

      overlayStore.register(overlay)
    })
  }

  return { open, abort }
}
