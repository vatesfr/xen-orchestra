<template>
  <UiModal icon="status:info-picto" accent="info" @dismiss="emit('close')">
    <template #title>{{ t('what-is-an-eol-host?') }}</template>
    <template #content>{{ t('what-is-an-eol-host-content') }}</template>
  </UiModal>
</template>

<script lang="ts" setup>
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
