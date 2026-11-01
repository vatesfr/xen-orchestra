<template>
  <UiModal :accent :icon class="vdf-confirm-modal" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>
    <template #content>{{ message }}</template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ confirmLabel }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

// A confirmation with the texts of its caller, laid out as XO's own
// (VtsDeleteModal, ServerForgetModal): "Go back" and the action.
defineProps<{
  accent: ModalAccent
  icon: IconName
  title: string
  message: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>
