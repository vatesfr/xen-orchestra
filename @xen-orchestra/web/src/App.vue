<template>
  <component :is="route.meta.story ? StoryLayout : AppLayout">
    <RouterView />
  </component>
  <VtsTooltipList />
</template>

<script lang="ts" setup>
import AppLayout from '@/layouts/AppLayout.vue'
import StoryLayout from '@/layouts/StoryLayout.vue'
import VtsTooltipList from '@core/components/tooltip-list/VtsTooltipList.vue'
import { useChartTheme } from '@core/composables/chart-theme.composable.ts'
import { locales } from '@core/i18n'
import { useUiStore } from '@core/stores/ui.store'
import { useActiveElement, useMagicKeys, whenever } from '@vueuse/core'
import { useCookies } from '@vueuse/integrations/useCookies'
import { logicAnd } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const uiStore = useUiStore()
const { locale } = useI18n()
const { get } = useCookies()
const route = useRoute()

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
