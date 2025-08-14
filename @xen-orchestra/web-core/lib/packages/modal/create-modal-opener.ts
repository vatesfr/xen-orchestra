import { useModalStore } from '@core/packages/modal/modal.store.ts'
import {
  ABORT_MODAL,
  ModalCancelResponse,
  type ModalConfig,
  ModalConfirmResponse,
  type ModalHandlerArgs,
  type ModalResponse,
} from '@core/packages/modal/types.ts'
import { computed, defineAsyncComponent, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function createModalOpener() {
  const modalStore = useModalStore()

  const route = useRoute()

  const ids = new Set<symbol | string>()

  function closeById(id: string | symbol) {
    modalStore.removeModal(id)
    ids.delete(id)
  }

  watch(
    () => route.path,
    () => {
      ids.forEach(id => {
        if (!modalStore.getModal(id)?.keepOpenOnRouteChange) {
          closeById(id)
        }
      })
    }
  )

  return function openModal<
    TProps,
    TConfirmArgs extends ModalHandlerArgs<TProps, 'onConfirm'>,
    TCancelArgs extends ModalHandlerArgs<TProps, 'onCancel'>,
    TConfirmPayload = undefined,
    TCancelPayload = undefined,
  >(id: string | symbol, config: ModalConfig<TProps, TConfirmArgs, TCancelArgs, TConfirmPayload, TCancelPayload>) {
    const close = () => closeById(id)

    const promise = new Promise<ModalResponse<TConfirmPayload, TCancelPayload>>(resolve => {
      const isBusy = ref(false)

      modalStore.addModal({
        id,
        component: defineAsyncComponent(() => config.component),
        isBusy: computed(() => isBusy.value),
        props: reactive(config.props ?? {}),
        keepOpenOnRouteChange: config.keepOpenOnRouteChange ?? false,
        onConfirm: async (...args: TConfirmArgs) => {
          try {
            isBusy.value = true

            const result = config.onConfirm ? await config.onConfirm(...args) : (undefined as TConfirmPayload)

            if (result === ABORT_MODAL || result instanceof ModalCancelResponse) {
              return
            }

            if (result instanceof ModalConfirmResponse) {
              resolve(result)
            } else {
              resolve(new ModalConfirmResponse(result))
            }

            close()
          } finally {
            isBusy.value = false
          }
        },
        onCancel: async (...args: TCancelArgs) => {
          try {
            isBusy.value = true

            const result = config.onCancel ? await config.onCancel(...args) : (undefined as TCancelPayload)

            if (result === ABORT_MODAL || result instanceof ModalCancelResponse) {
              return
            }

            if (result instanceof ModalConfirmResponse) {
              resolve(new ModalCancelResponse(result.payload))
            } else {
              resolve(new ModalCancelResponse(result))
            }

            close()
          } finally {
            isBusy.value = false
          }
        },
      })
    })

    return Object.assign(promise, {
      close,
    })
  }
}
