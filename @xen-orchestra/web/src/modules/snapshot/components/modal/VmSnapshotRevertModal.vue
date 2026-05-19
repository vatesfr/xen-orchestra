<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      {{ t('confirm-vm-revert') }}
    </template>

    <template #content>
      {{ t('snapshot-revert-warning') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>{{ t('action:revert-to-snapshot') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
