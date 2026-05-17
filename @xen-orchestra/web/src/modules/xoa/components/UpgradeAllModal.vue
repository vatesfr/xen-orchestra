<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>{{ t('patches:upgrade-all') }}</template>
    <template #content>
      {{ t('patches:upgrade-all-confirm', { count }) }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>{{ t('action:upgrade-all') }}</VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const { t } = useI18n()
</script>
