<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ t('sr-disconnect-title', { n: count }) }}
    </template>

    <template #content>
      {{ t('sr-disconnect-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:disconnect-n-srs', { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const { count } = defineProps<{
  count: number
}>()

const { t } = useI18n()
</script>
