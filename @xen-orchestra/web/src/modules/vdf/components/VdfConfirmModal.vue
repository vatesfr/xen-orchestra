<template>
  <UiModal :accent :icon @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>{{ title }}</template>
    <template #content>
      <div class="vdf-confirm-modal">{{ message }}</div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ confirmLabel }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import type { IconName } from '@core/icons'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal, { type ModalAccent } from '@core/components/ui/modal/UiModal.vue'

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
</script>

<style lang="postcss" scoped>
.vdf-confirm-modal {
  max-width: 56rem;
}
</style>
