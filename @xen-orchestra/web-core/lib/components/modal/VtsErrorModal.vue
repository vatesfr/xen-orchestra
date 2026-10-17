<template>
  <UiModal
    class="vts-error-modal"
    accent="danger"
    icon="status:info-picto"
    @dismiss="emit('close')"
    @confirm="emit('close')"
  >
    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="content">
        <slot name="content">
          {{ error }}
        </slot>
        <UiLogEntryViewer
          v-if="details !== undefined"
          :label="t('see-details')"
          :content="details"
          accent="danger"
          size="small"
          class="details"
        />
      </div>
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
import UiLogEntryViewer from '@core/components/ui/log-entry-viewer/UiLogEntryViewer.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error?: string
  details?: string | object
}>()

const emit = defineEmits<{
  close: []
}>()

defineSlots<{
  content?(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.vts-error-modal {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .details {
    text-align: start;
    /* The small action buttons must not overflow the scrollable modal content */
    overflow-x: clip;
  }
}
</style>
