<template>
  <UiModal accent="warning" icon="status:warning-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT keypath="confirm-disconnect" scope="global" tag="div">
        <span class="n-disconnect">{{ title }}</span>
      </I18nT>
    </template>

    <template #content>
      {{ t('modal:pool-disconnect-message') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ t('action:disconnect-pool') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { I18nT, useI18n } from 'vue-i18n'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.n-disconnect {
  color: var(--color-warning-item-base);
}
</style>
