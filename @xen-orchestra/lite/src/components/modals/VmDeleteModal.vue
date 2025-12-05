<template>
  <VtsModal accent="warning" icon="fa:satellite">
    <template #title>
      <I18nT keypath="confirm-delete" scope="global" tag="div">
        <span class="n-vms">{{ t('n-vms', { n: count }) }}</span>
      </I18nT>
    </template>
    <template #content>
      {{ t('please-confirm') }}
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:delete-vms', { n: count }) }}
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
  count: number
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.n-vms {
  color: var(--color-warning-item-base);
}
</style>
