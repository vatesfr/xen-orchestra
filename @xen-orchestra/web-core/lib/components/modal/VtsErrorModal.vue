<template>
  <VtsOverlay type="modal" accent="danger" icon="status:danger-picto" dismissible>
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <slot name="content">
        {{ error }}
      </slot>
    </template>

    <template #buttons>
      <VtsOverlayConfirmButton>
        {{ t('action:close') }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error?: string
}>()

defineSlots<{
  content?(): any
}>()

const { t } = useI18n()
</script>
