<template>
  <VtsOverlay type="modal" icon="fa:user-astronaut" dismissible accent="info">
    <template #title>{{ t('what-does-protected-mean?') }}</template>
    <template #content>{{ t('what-does-protected-mean-content') }}</template>
  </VtsOverlay>
</template>

<script setup lang="ts">
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
