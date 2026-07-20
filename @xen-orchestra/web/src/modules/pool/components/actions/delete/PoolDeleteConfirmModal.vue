<template>
  <VtsModal accent="warning" icon="action:delete">
    <template #title>
      {{ t('pool-delete-confirm-title', { name: serverLabel }) }}
    </template>
    <template #content>
      {{ t('pool-delete-confirm-info') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:delete') }}
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
  serverLabel?: string
}>()

const { t } = useI18n()
</script>
