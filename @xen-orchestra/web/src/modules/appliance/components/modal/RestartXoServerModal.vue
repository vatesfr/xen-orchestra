<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ t('modal:restart-xo-server-title') }}
    </template>

    <template #content>
      {{ t('appliance:restart-interrupts-warning') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:restart-xo-server') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>
