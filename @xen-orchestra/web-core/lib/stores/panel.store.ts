import { useUiStore } from '@core/stores/ui.store'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const usePanelStore = defineStore('panel', () => {
  const uiStore = useUiStore()
  const isExpanded = ref(false)
  const open = () => (isExpanded.value = true)
  const close = () => (isExpanded.value = false)

  return { open, close, isExpanded: computed(() => uiStore.isDesktop || isExpanded.value) }
})
