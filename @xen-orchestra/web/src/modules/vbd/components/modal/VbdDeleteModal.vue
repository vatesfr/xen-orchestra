<template>
  <VtsModal accent="info" icon="status:info-picto">
    <template #title>
      {{ t('vbd-delete-title', { n: count }) }}
    </template>
    <template #content>
      {{ t('vbd-delete-info') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t(`action:delete-n-vbds`, { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@xen-orchestra/web-core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@xen-orchestra/web-core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@xen-orchestra/web-core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  count: number
}>()

const { t } = useI18n()
</script>
