import { useBreakpoints, useColorMode } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export const useUiStore = defineStore('ui', () => {
  const currentHostOpaqueRef = ref()

  const { store: colorMode } = useColorMode({ initialValue: 'auto' })

  const breakpoints = useBreakpoints({
    medium: 1024,
    large: 1440,
  })

  const isSmall = breakpoints.smaller('medium')
  const isSmallOrMedium = breakpoints.smallerOrEqual('medium')
  const isMedium = breakpoints.between('medium', 'large')
  const isMediumOrLarge = breakpoints.greaterOrEqual('medium')
  const isLarge = breakpoints.greater('large')

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
    isSmall,
    isSmallOrMedium,
    isMedium,
    isMediumOrLarge,
    isLarge,
    hasUi,
  }
})
