<template>
  <UiModal accent="danger" icon="fa:exclamation-circle" @dismiss="emit('close')" @confirm="emit('close')">
    <template #title>{{ t('invalid-field') }}</template>
    <template #content>{{ message }}</template>
    <template #buttons>
      <VtsOverlayConfirmButton>
        {{ t('ok') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  message: string
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
</script>
