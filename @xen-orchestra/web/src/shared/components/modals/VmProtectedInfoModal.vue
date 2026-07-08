<template>
  <UiModal icon="fa:user-astronaut" accent="info" @dismiss="emit('close')">
    <template #title>{{ t('what-does-protected-mean?') }}</template>
    <template #content>{{ t('what-does-protected-mean-content') }}</template>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
