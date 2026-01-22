<template>
  <VtsModal accent="warning" icon="fa:satellite">
    <template #title>
      <I18nT :keypath="`action:${action}`" scope="global" tag="div" />
    </template>
    <template #content>
      <span class="action">{{ t(`confirm-${action}`, { name }) }}</span>
    </template>
    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t(`action:${action}`) }}
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
  name: string
  action: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.action {
  color: var(--color-warning-item-base);
}
</style>
