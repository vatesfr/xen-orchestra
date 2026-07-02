import { useOverlayStore } from '@core/packages/overlay/overlay.store'
import {
  KEEP_OVERLAY_OPEN,
  OverlayAbortResponse,
  OverlayCancelResponse,
  type OverlayConfig,
  OverlayConfirmResponse,
  type OverlayHandlerArgs,
  type OverlayResponse,
} from '@core/packages/overlay/types.ts'
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type OverlayEntry = {
  abort: () => void
}

export function createOverlayOpener() {
  const overlayStore = useOverlayStore()

  const router = useRouter()

  const route = useRoute()

  const overlayEntries = new Map<string | symbol, OverlayEntry>()

  function abortById(id: string | symbol) {
    overlayEntries.get(id)?.abort()
  }

  if (router !== undefined && route !== undefined) {
    const isRouterReady = ref(false)

    router.isReady().then(() => {
      isRouterReady.value = true
    })

    watch(
      () => route.path,
      () => {
        // The initial navigation (START_LOCATION → first route) is not a user navigation:
        // it must not abort overlays opened during app setup.
        if (!isRouterReady.value) {
          return
        }

        for (const id of overlayEntries.keys()) {
          if (!overlayStore.getOverlay(id)?.keepOpenOnRouteChange) {
            abortById(id)
          }
        }
      }
    )
  }

  return function openOverlay<
    TProps,
    TConfirmArgs extends OverlayHandlerArgs<TProps, 'onConfirm'>,
    TCancelArgs extends OverlayHandlerArgs<TProps, 'onCancel'>,
    TConfirmPayload = undefined,
    TCancelPayload = undefined,
  >(id: string | symbol, config: OverlayConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>) {
    const promise = new Promise<OverlayResponse<TConfirmPayload, TCancelPayload>>((resolve, reject) => {
      const isBusy = ref(false)

      function settle(response: OverlayResponse<TConfirmPayload, TCancelPayload>) {
        resolve(response)
        overlayStore.removeOverlay(id)
        overlayEntries.delete(id)
      }

      overlayEntries.set(id, {
        abort: () => {
          if (isBusy.value) {
            return
          }

          settle(new OverlayAbortResponse())
        },
      })

      overlayStore.addOverlay({
        id,
        component: defineAsyncComponent({
          loader: () => config.component,
          onError(_error, _retry, fail) {
            fail()
          },
        }),
        isBusy: computed(() => isBusy.value),
        props: reactive(config.props ?? {}),
        keepOpenOnRouteChange: config.keepOpenOnRouteChange ?? false,
        onConfirm: async (...args: TConfirmArgs) => {
          try {
            isBusy.value = true

            const result = config.onConfirm ? await config.onConfirm(...args) : (undefined as TConfirmPayload)

            if (result === KEEP_OVERLAY_OPEN || result instanceof OverlayCancelResponse) {
              return
            }

            if (result instanceof OverlayConfirmResponse) {
              settle(result)
            } else {
              settle(new OverlayConfirmResponse(result))
            }
          } catch (error) {
            reject(error)
          } finally {
            isBusy.value = false
          }
        },
        onCancel: async (...args: TCancelArgs) => {
          try {
            isBusy.value = true

            const result = config.onCancel ? await config.onCancel(...args) : (undefined as TCancelPayload)

            if (result === KEEP_OVERLAY_OPEN || result instanceof OverlayCancelResponse) {
              return
            }

            if (result instanceof OverlayConfirmResponse) {
              settle(new OverlayCancelResponse(result.payload))
            } else {
              settle(new OverlayCancelResponse(result))
            }
          } catch (error) {
            reject(error)
          } finally {
            isBusy.value = false
          }
        },
      })
    })

    return Object.assign(promise, {
      abort: () => abortById(id),
    })
  }
}
