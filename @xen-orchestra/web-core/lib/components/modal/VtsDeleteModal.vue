<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      <I18nT keypath="confirm-delete" scope="global" tag="div">
        <span class="n-delete">
          <slot name="title" />
        </span>
      </I18nT>
    </template>

    <template #content>
      <slot name="content">{{ t('please-confirm-to-continue') }}</slot>
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        <slot name="confirm" />
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

defineSlots<{
  title(): any
  content?(): any
  confirm(): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.n-delete {
  color: var(--color-warning-item-base);
}
</style>
