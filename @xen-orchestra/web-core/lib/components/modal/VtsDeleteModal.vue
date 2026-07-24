<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT keypath="confirm-delete" scope="global" tag="div">
        <span class="n-delete">
          {{ subject }}
        </span>
      </I18nT>
    </template>

    <template #content>
      {{ description ?? t('please-confirm-to-continue') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ confirmLabel }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

const { subject, description, confirmLabel } = defineProps<{
  subject: string
  confirmLabel: string
  description?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.n-delete {
  color: var(--color-warning-item-base);
}
</style>
