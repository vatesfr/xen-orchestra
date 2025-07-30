import { useBreakpoints, useColorMode } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const useUiStore = defineStore('ui', () => {
  const currentHostOpaqueRef = ref()

  const { store: colorMode } = useColorMode({ initialValue: 'auto' })

  const breakpoints = useBreakpoints({
    desktop: 1024,
    desktopLarge: 1440,
  })

  const isMobile = breakpoints.smaller('desktop')
  const isDesktop = breakpoints.between('desktop', 'desktopLarge')
  const isDesktopLarge = breakpoints.greater('desktopLarge')

  const router = useRouter()
  const route = useRoute()

  const hasUi = computed<boolean>({
    get: () => route.query.ui !== '0',
    set: (value: boolean) => {
      void router.replace({ query: { ui: value ? undefined : '0' } })
    },
  })

  return {
    colorMode,
    currentHostOpaqueRef,
    isMobile,
    isDesktop,
    isDesktopLarge,
    hasUi,
  }
})
