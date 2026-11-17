<template>
  <UiModal :accent :icon @confirm="isConfirmed && emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="vts-type-to-confirm-modal">
        <p v-if="description">{{ description }}</p>
        <VtsTypeToConfirmInput v-model="isConfirmed" :confirmation-text />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton :disabled="!isConfirmed">
        {{ confirmLabel }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTypeToConfirmInput from '@core/components/type-to-confirm-input/VtsTypeToConfirmInput.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import type { IconName } from '@core/icons'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  accent: ModalAccent
  title: string
  confirmationText: string
  confirmLabel: string
  icon?: IconName
  description?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const isConfirmed = ref(false)
</script>

<style lang="postcss" scoped>
.vts-type-to-confirm-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
