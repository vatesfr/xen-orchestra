<template>
  <VtsModal accent="info" icon="status:info-picto">
    <template #title>
      {{ t('pif-management-reconfigure-title') }}
    </template>

    <template #content>
      {{ t('pif-management-reconfigure-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:set-as-management') }}
      </VtsModalConfirmButton>
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
