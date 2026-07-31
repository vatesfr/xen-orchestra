<template>
  <UiModal accent="info" icon="status:info-picto" @confirm="emit('confirm')" @dismiss="emit('cancel')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      {{ info }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ confirmLabel }}
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
import type { SrAccessMode, SrScope } from '@core/types/storage-repository.type.ts'
import { getSrModalInfoVariant } from '@core/utils/sr.utils.ts'
import { useI18n } from 'vue-i18n'

const { action, count, scope, accessMode, hostsCount } = defineProps<{
  action: ConnectionAction
  count: number
  scope: SrScope
  accessMode: SrAccessMode
  hostsCount: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

const title = useMapper(
  () => action,
  () => ({
    [CONNECTION_ACTION.CONNECT]: t('sr-connect-title', { n: count }),
    [CONNECTION_ACTION.DISCONNECT]: t('sr-disconnect-title', { n: count }),
  }),
  CONNECTION_ACTION.CONNECT
)

const info = useMapper(
  () => `${action}-${getSrModalInfoVariant(scope, accessMode)}`,
  () => ({
    'connect-host': t('sr-connect-info-host', { n: count }),
    'connect-pool-local': t('sr-connect-info-pool-local', { n: count }),
    'connect-pool-mixed': t('sr-connect-info-pool-mixed'),
    'connect-pool-shared': t('sr-connect-info-pool-shared', { n: count, hostsCount }),
    'disconnect-host': t('sr-disconnect-info-host', { n: count }),
    'disconnect-pool-local': t('sr-disconnect-info-pool-local', { n: count }),
    'disconnect-pool-mixed': t('sr-disconnect-info-pool-mixed'),
    'disconnect-pool-shared': t('sr-disconnect-info-pool-shared', { n: count, hostsCount }),
  }),
  'connect-pool-shared'
)

const confirmLabel = useMapper(
  () => action,
  () => ({
    [CONNECTION_ACTION.CONNECT]: t('action:connect-n-srs', { n: count }),
    [CONNECTION_ACTION.DISCONNECT]: t('action:disconnect-n-srs', { n: count }),
  }),
  CONNECTION_ACTION.CONNECT
)
</script>
