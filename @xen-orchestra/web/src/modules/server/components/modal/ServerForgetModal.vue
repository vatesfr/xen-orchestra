<template>
  <UiModal accent="warning" icon="action:forget" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      <I18nT keypath="pool-forget-confirm-title" scope="global" tag="div">
        <template #name>
          <strong>{{ serverLabel }}</strong>
        </template>
      </I18nT>
    </template>
    <template #content>
      {{ t('pool-forget-confirm-info') }}
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ t('action:forget') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@xen-orchestra/web-core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@xen-orchestra/web-core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@xen-orchestra/web-core/components/ui/modal/UiModal.vue'
import { I18nT, useI18n } from 'vue-i18n'

defineProps<{
  serverLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>
