<template>
  <VtsActionButton
    variant="tertiary"
    accent="danger"
    icon="action:delete"
    :hint="tooltip || undefined"
    :disabled
    :busy
    :on-click
  >
    {{ t('action:delete') }}
  </VtsActionButton>
</template>

<script setup lang="ts">
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  busy?: boolean
  disabled?: boolean
  tooltip?: string | false
  onClick?: () => unknown
}>()

const { t } = useI18n()
</script>
