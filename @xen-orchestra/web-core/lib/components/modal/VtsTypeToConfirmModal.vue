<template>
  <UiModal :accent :icon @confirm="isConfirmed && emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="vts-type-to-confirm-modal">
        <p v-if="description">{{ description }}</p>
        <p class="instruction">{{ t('type-below-to-continue') }}</p>
        <UiTag :accent class="confirmation-text" variant="primary">{{ confirmationText }}</UiTag>
        <UiInput v-model="typedText" accent="brand" />
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
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import type { IconName } from '@core/icons'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { confirmationText } = defineProps<{
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

const typedText = ref('')

const isConfirmed = computed(() => typedText.value === confirmationText)
</script>

<style lang="postcss" scoped>
.vts-type-to-confirm-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .instruction {
    color: var(--color-neutral-txt-secondary);
  }

  .confirmation-text {
    align-self: center;
  }
}
</style>
