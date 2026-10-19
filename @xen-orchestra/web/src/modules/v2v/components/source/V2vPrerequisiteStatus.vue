<template>
  <UiInfo :accent="display.accent" wrap>
    {{ display.message }}
  </UiInfo>
</template>

<script lang="ts" setup>
import type { V2vPrerequisiteState } from '@/modules/v2v/utils/v2v-prerequisite.util.ts'
import UiInfo, { type InfoAccent } from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { prerequisite } = defineProps<{
  prerequisite: V2vPrerequisiteState
}>()

const { t } = useI18n()

const display = computed<{ accent: InfoAccent; message: string }>(() => {
  if (prerequisite.state === 'checking') {
    return { accent: 'info', message: t('v2v:prerequisite-checking') }
  }

  if (prerequisite.state === 'ok') {
    return { accent: 'success', message: t('v2v:prerequisite-ok') }
  }

  return {
    accent: 'danger',
    message:
      prerequisite.error === undefined
        ? t('v2v:prerequisite-error')
        : t('v2v:prerequisite-error-detail', { error: prerequisite.error }),
  }
})
</script>
