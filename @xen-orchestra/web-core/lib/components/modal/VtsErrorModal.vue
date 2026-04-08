<template>
  <VtsModal accent="danger" icon="status:danger-picto" dismissible>
    <template #title>
      {{ title }}
    </template>

    <template #content>
      {{ error }}
    </template>

    <template #buttons>
      <VtsModalConfirmButton>
        {{ t('action:close') }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  error: string
}>()

const { t } = useI18n()
</script>
