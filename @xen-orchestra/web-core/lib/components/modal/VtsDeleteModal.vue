<template>
  <VtsOverlay type="modal" accent="warning" icon="status:warning-picto">
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
      <VtsOverlayCancelButton>{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        <slot name="confirm" />
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
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
