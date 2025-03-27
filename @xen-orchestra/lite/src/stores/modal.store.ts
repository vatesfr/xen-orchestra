import type { ModalController } from '@/types'
import { createEventHook } from '@vueuse/core'
import { defineStore } from 'pinia'
import { type AsyncComponentLoader, computed, defineAsyncComponent, markRaw, reactive, ref } from 'vue'

export const useModalStore = defineStore('modal', () => {
  const modals = ref(new Map<symbol, ModalController>())

  const open = <T>(loader: AsyncComponentLoader, props: object) => {
    const id = Symbol('MODAL_ID')
    const isBusy = ref(false)
    const component = defineAsyncComponent(loader)

    const approveEvent = createEventHook<T>()
    const declineEvent = createEventHook()
    const closeEvent = createEventHook()

    const close = async () => {
      await closeEvent.trigger(undefined)
      modals.value.delete(id)
    }

    const approve = async (payload: any) => {
      try {
        isBusy.value = true
        const result = await payload
        // @ts-expect-error https://github.com/vueuse/vueuse/issues/4610
        await approveEvent.trigger(result)
        await close()
      } finally {
        isBusy.value = false
      }
    }

    const decline = async () => {
      try {
        isBusy.value = true
        await declineEvent.trigger(undefined)
        await close()
      } finally {
        isBusy.value = false
      }
    }

    modals.value.set(
      id,
      reactive({
        id,
        component: markRaw(component),
        props,
        approve,
        decline,
        isBusy,
      })
    )

    return {
      onApprove: approveEvent.on,
      onDecline: declineEvent.on,
      onClose: closeEvent.on,
      id,
    }
  }

  return {
    open,
    modals: computed(() => modals.value.values()),
  }
})
