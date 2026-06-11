import { useDrawerStore } from '@core/packages/drawer/drawer.store.ts'
import {
  ABORT_DRAWER,
  DrawerCancelResponse,
  type DrawerConfig,
  DrawerConfirmResponse,
  type DrawerHandlerArgs,
  type DrawerResponse,
} from '@core/packages/drawer/types.ts'
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function createDrawerOpener() {
  const drawerStore = useDrawerStore()

  const route = useRoute()

  const ids = new Set<symbol | string>()
  const cancelers = new Map<string | symbol, () => void>()

  function closeById(id: string | symbol) {
    drawerStore.removeDrawer(id)
    ids.delete(id)
    cancelers.delete(id)
  }

  if (route !== undefined) {
    watch(
      () => route.path,
      () => {
        ids.forEach(id => {
          if (!drawerStore.getDrawer(id)?.keepOpenOnRouteChange) {
            cancelers.get(id)?.()
            closeById(id)
          }
        })
      }
    )
  }

  return function openDrawer<
    TProps,
    TConfirmArgs extends DrawerHandlerArgs<TProps, 'onConfirm'>,
    TCancelArgs extends DrawerHandlerArgs<TProps, 'onCancel'>,
    TConfirmPayload = undefined,
    TCancelPayload = undefined,
  >(id: string | symbol, config: DrawerConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>) {
    const close = () => closeById(id)

    const promise = new Promise<DrawerResponse<TConfirmPayload, TCancelPayload>>((resolve, reject) => {
      const isBusy = ref(false)

      cancelers.set(id, () => resolve(new DrawerCancelResponse(undefined as TCancelPayload)))

      drawerStore.addDrawer({
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

            close()

            const result = config.onConfirm ? await config.onConfirm(...args) : (undefined as TConfirmPayload)

            if (result === ABORT_DRAWER || result instanceof DrawerCancelResponse) {
              return
            }

            if (result instanceof DrawerConfirmResponse) {
              resolve(result)
            } else {
              resolve(new DrawerConfirmResponse(result))
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

            if (result === ABORT_DRAWER || result instanceof DrawerCancelResponse) {
              return
            }

            if (result instanceof DrawerConfirmResponse) {
              resolve(new DrawerCancelResponse(result.payload))
            } else {
              resolve(new DrawerCancelResponse(result))
            }

            close()
          } catch (error) {
            reject(error)
          } finally {
            isBusy.value = false
          }
        },
      })

      ids.add(id)
    })

    return Object.assign(promise, { close })
  }
}
