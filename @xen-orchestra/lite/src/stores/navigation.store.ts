import { useUiStore } from '@core/stores/ui.store'
import { useEventListener, whenever } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const uiStore = useUiStore()

  const trigger = ref()
  const isOpen = ref(true)
  const toggle = () => (isOpen.value = !isOpen.value)

  useEventListener(trigger, 'click', toggle)

  whenever(
    () => !uiStore.isSmall,
    () => (isOpen.value = false)
  )

  return {
    trigger,
    toggle,
    isOpen,
  }
})
