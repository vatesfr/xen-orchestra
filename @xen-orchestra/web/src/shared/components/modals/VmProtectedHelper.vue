<template>
  <VtsModal icon="fa:user-astronaut" dismissible accent="info">
    <template #title>{{ t('what-does-protected-mean?') }}</template>
    <template #content>{{ t('what-does-protected-mean-content') }}</template>
  </VtsModal>
</template>

<script setup lang="ts">
import VtsModal from '@core/components/modal/VtsModal.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
