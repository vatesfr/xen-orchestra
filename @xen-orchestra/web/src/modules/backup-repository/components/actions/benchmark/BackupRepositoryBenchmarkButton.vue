<template>
  <UiButtonIcon
    v-tooltip="canBenchmark ? t('click-test-br-speed') : errorMessage"
    :icon="isBenchmarking ? 'fa:spinner' : 'action:scan'"
    :disabled="!canBenchmark"
    accent="brand"
    size="small"
    @click="emit('click')"
  />
</template>

<script lang="ts" setup>
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  canBenchmark: boolean
  isBenchmarking: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n()
</script>
