<template>
  <VtsModal accent="warning" icon="status:warning-picto" dismissible>
    <template #title>
      {{ t('sr-create-erase-confirm-title') }}
    </template>

    <template #content>
      <I18nT keypath="sr-create-erase-confirm" scope="global">
        <template #device>
          <span class="device">{{ device }}</span>
        </template>
      </I18nT>
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ t('action:create') }}
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
  device: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.device {
  font-family: 'Courier New', Courier, monospace;
  color: var(--color-warning-txt-base);
}
</style>
