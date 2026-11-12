<template>
  <UiModal accent="danger" icon="status:danger-picto" @confirm="emit('confirm')" @dismiss="emit('confirm')">
    <template #title>{{ title }}</template>

    <template #content>{{ description }}</template>

    <template #buttons>
      <VtsOverlayConfirmButton>{{ t('action:close') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  description: string
}>()

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()
</script>
