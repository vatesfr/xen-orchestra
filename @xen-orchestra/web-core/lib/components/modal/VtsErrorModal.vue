<template>
  <UiModal accent="danger" icon="status:danger-picto" @dismiss="emit('close')" @confirm="emit('close')">
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
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error?: string
}>()

const emit = defineEmits<{
  close: []
}>()

defineSlots<{
  content?(): any
}>()

const { t } = useI18n()
</script>
