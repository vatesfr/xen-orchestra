<template>
  <VtsOverlay type="modal" accent="info" icon="status:info-picto">
    <template #title>
      {{ connection.title }}
    </template>

    <template v-if="action === CONNECTION_ACTION.DISCONNECT" #content>
      {{ t('vif-disconnect-info') }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton>{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ connection.action }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION, type ConnectionAction } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { action, count } = defineProps<{
  action: ConnectionAction
  count: number
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
