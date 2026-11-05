<template>
  <UiModal accent="info" icon="status:info-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ connection.title }}
    </template>

    <template #content>
      <template v-if="action === CONNECTION_ACTION.DISCONNECT">{{ t('vif-disconnect-info') }}</template>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ connection.action }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION, type ConnectionAction } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { action, count } = defineProps<{
  action: ConnectionAction
  count: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const connection = useMapper(
  () => action,
  () => ({
    connect: { title: t('vif-connect-title', { n: count }), action: t('action:connect-n-vifs', { n: count }) },
    disconnect: { title: t('vif-disconnect-title', { n: count }), action: t('action:disconnect-n-vifs', { n: count }) },
  }),
  'connect'
)
</script>
