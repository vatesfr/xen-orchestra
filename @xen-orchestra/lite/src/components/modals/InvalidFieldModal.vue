<template>
  <VtsOverlay type="modal" accent="danger" dismissible icon="fa:exclamation-circle">
    <template #title>{{ t('invalid-field') }}</template>
    <template #content>{{ message }}</template>
    <template #buttons>
      <VtsOverlayConfirmButton>
        {{ t('ok') }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  message: string
}>()

const { t } = useI18n()
</script>
