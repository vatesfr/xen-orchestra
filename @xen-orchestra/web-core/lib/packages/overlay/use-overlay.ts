import { createEventHandler } from '@core/packages/overlay/create-event-handler'
import { OVERLAY_ABORT_EVENT } from '@core/packages/overlay/symbols'
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
} from '@core/packages/overlay/types'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store'
import { reactiveComputed } from '@vueuse/core'
import { defineAsyncComponent, markRaw, onScopeDispose, reactive, type AsyncComponentLoader, type Component } from 'vue'
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

  let abortCurrent: (() => void) | undefined

  onScopeDispose(() => abortCurrent?.(), true)

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

    // Reopening while the previous overlay is still open replaces it
    abortCurrent?.()

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
      })

      function settle(response: ExtractOverlayResponse<TComponent, TEvents, TOpenEvents>) {
        overlay.status = 'settled'
        abortCurrent = undefined
        resolve(response)
        overlayStore.unregister(overlay)
      }

      abortCurrent = () => settle({ event: OVERLAY_ABORT_EVENT, payload: undefined })

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

  return { open }
}
