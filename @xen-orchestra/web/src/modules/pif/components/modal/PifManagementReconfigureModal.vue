<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ t('modal:pif-management-reconfigure-title', { device }) }}
    </template>

    <template #content>
      {{ t('modal:pif-management-reconfigure-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:confirm') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  device: string
}>()

const { t } = useI18n()
</script>
