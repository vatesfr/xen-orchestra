<template>
  <UiModal accent="danger" icon="status:danger-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>{{ t('firewall:draft:discard:title', { n: changeCount }, changeCount) }}</template>
    <template #content>{{ t('firewall:draft:discard:message') }}</template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>{{ t('firewall:draft:discard') }}</VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  changeCount: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
</script>
