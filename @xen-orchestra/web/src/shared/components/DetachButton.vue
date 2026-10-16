<template>
  <UiButton
    v-tooltip="tooltip"
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:detach"
    :disabled
    :busy
  >
    {{ t('action:detach') }}
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  busy?: boolean
  disabled?: boolean
  tooltip?: string | false
}>()

const { t } = useI18n()
</script>
