import type { RegisteredModal } from '@core/packages/modal/types.ts'
import { defineStore } from 'pinia'
import { computed, shallowReactive } from 'vue'

export const useModalStore = defineStore('new-modal', () => {
  const modals = shallowReactive(new Map<symbol | string, RegisteredModal>())

  const addModal = (modal: RegisteredModal) => {
    modals.set(modal.id, modal)
  }

  const removeModal = (id: symbol | string) => {
    modals.delete(id)
  }

  return {
    modals: computed(() => Array.from(modals.values())),
    getModal: (id: symbol | string) => modals.get(id),
    addModal,
    removeModal,
  }
})
