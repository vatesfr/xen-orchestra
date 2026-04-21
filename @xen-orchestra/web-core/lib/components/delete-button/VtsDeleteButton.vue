<template>
  <UiButton
    v-tooltip="tooltip"
    size="medium"
    variant="tertiary"
    accent="danger"
    left-icon="action:delete"
    :disabled
    :busy
  >
    {{ t('action:delete') }}
  </UiButton>
</template>

<script setup lang="ts">
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useI18n } from 'vue-i18n'

defineProps<{
  busy?: boolean
  disabled?: boolean
  tooltip?: string | false
}>()

const { t } = useI18n()
</script>
