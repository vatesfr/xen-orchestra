<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
  <VtsModalList />
  <VtsTooltipList />
</template>

<script lang="ts" setup>
import AppLayout from '@/layouts/AppLayout.vue'
import VtsModalList from '@core/components/modal/VtsModalList.vue'
import VtsTooltipList from '@core/components/tooltip-list/VtsTooltipList.vue'
import { useChartTheme } from '@core/composables/chart-theme.composable.ts'
import { locales } from '@core/i18n'
import { useModal } from '@core/packages/modal/use-modal'
import { useUiStore } from '@core/stores/ui.store'
import { useActiveElement, useLocalStorage, useMagicKeys, whenever } from '@vueuse/core'
import { useCookies } from '@vueuse/integrations/useCookies'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const uiStore = useUiStore()
const { locale } = useI18n()
const { get } = useCookies()

// TODO: Remove when we considere XO6 in more advanced state
const isFirstConnection = useLocalStorage('first-connection', true)
if (isFirstConnection.value) {
  const open = useModal({
    component: import('@/components/modals/FirstConnection.vue'),
    onConfirm: () => {
      isFirstConnection.value = false
    },
  })

  open()
}
const cookieLang = get('lang')
locale.value = cookieLang && locales[cookieLang] ? cookieLang : 'en'

useChartTheme()

if (import.meta.env.DEV) {
  const { locale } = useI18n()
  const activeElement = useActiveElement()
  const { D, L } = useMagicKeys()

  const canToggle = computed(() => {
    if (activeElement.value == null) {
      return true
    }

    return !['INPUT', 'TEXTAREA'].includes(activeElement.value.tagName)
  })

  whenever(logicAnd(D, canToggle), () => (uiStore.colorMode = uiStore.colorMode === 'dark' ? 'light' : 'dark'))

  whenever(logicAnd(L, canToggle), () => (locale.value = locale.value === 'en' ? 'fr' : 'en'))
}
</script>
