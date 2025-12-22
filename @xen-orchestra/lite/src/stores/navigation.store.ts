import { useUiStore } from '@core/stores/ui.store'
import { useEventListener } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  const uiStore = useUiStore()

  const trigger = ref()
  const isOpen = ref(true)
  const toggle = () => (isOpen.value = !isOpen.value)

  useEventListener(trigger, 'click', toggle)

  watch(
    () => uiStore.isMobile,
    isMobile => {
      isOpen.value = !isMobile
    }
  )

  return {
    trigger,
    toggle,
    isOpen,
  }
})
