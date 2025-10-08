<template>
  <VtsModal accent="danger" dismissible icon="fa:exclamation-circle">
    <template #title>{{ t('invalid-field') }}</template>
    <template #content>{{ message }}</template>
    <template #buttons>
      <VtsModalConfirmButton>
        {{ t('ok') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  message: string
}>()

const { t } = useI18n()
</script>
