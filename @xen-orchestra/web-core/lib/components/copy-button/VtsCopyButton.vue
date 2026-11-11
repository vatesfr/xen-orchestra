<template>
  <UiButtonIcon
    v-tooltip="tooltipContent"
    :aria-label="label"
    :disabled="!isSupported"
    :icon
    size="small"
    accent="brand"
    @click="copy()"
  />
</template>

<script setup lang="ts">
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { value, label } = defineProps<{
  value: string
  label?: string
}>()

const { t } = useI18n()

const { copy, copied, isSupported } = useCopyToClipboard(() => value)

const icon = computed(() => (copied.value ? 'fa:check-circle' : 'fa:copy'))

const tooltipContent = computed(() => {
  if (!isSupported.value) {
    return t('copy-unavailable-http')
  }

  if (copied.value) {
    return t('copied')
  }

  return label ?? false
})
</script>
