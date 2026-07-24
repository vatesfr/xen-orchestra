<template>
  <UiModal accent="info" icon="status:info-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT keypath="confirm-disconnect" scope="global" tag="div">
        <span class="n-disconnect">{{ title }}</span>
      </I18nT>
    </template>

    <template #content>
      {{ t('pool-disconnect-info') }}
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
import { useI18n } from 'vue-i18n'

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
  color: var(--color-info-item-base);
}
</style>
