<template>
  <VtsActionButton variant="tertiary" accent="danger" icon="action:delete" :hint :disabled :busy :on-click>
    {{ t('action:delete') }}
  </VtsActionButton>
</template>

<script setup lang="ts">
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  busy?: boolean
  disabled?: boolean
  hint?: string
  onClick?: () => unknown
}>()

const { t } = useI18n()
</script>
