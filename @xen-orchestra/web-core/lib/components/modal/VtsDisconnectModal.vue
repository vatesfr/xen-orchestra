<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      <I18nT keypath="confirm-disconnect" scope="global" tag="div">
        <span class="n-disconnect">{{ title }}</span>
      </I18nT>
    </template>

    <template #content>
      {{ t('pool-disconnect-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:disconnect-pool') }}
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
  title: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.n-disconnect {
  color: var(--color-warning-txt-base);
}
</style>
