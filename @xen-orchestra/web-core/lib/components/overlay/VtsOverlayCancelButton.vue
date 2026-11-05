<template>
  <VtsOverlayButton variant="secondary">
    <slot>{{ t('cancel') }}</slot>
  </VtsOverlayButton>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()
</script>
