import { useUiStore } from '@/stores/ui.store'
import { useEventListener, whenever } from '@vueuse/core'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export enum NAV_TAB {
  VMS = 1,
  STORAGES = 2,
  NETWORKS = 3
}

export const useNavigationStore = defineStore('navigation', () => {
  const router = useRouter()
  const uiStore = useUiStore()

  const trigger = ref()
  const isOpen = ref(false)
  const currentNavigationTab = ref(NAV_TAB.VMS);
  const toggle = () => (isOpen.value = !isOpen.value)

  // Close the menu when the user navigates to a new page
  router.afterEach(() => {
    isOpen.value = false
  })

  useEventListener(trigger, 'click', toggle)

  whenever(
    () => uiStore.isDesktop,
    () => (isOpen.value = false)
  )

  return {
    trigger,
    toggle,
    isOpen,
  }
})
