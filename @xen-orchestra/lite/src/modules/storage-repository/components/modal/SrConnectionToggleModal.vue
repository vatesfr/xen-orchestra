<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ title }}
    </template>

    <template #content>
      {{ info }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ confirmLabel }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import { useSrModalMessages } from '@/modules/storage-repository/composables/use-sr-modal-messages.composable.ts'
import type { SrAccessMode, SrScope } from '@core/types/storage-repository.type.ts'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useMapper } from '@core/packages/mapper'
import { CONNECTION_ACTION, type ConnectionAction } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { action, count, scope, accessMode, hostsCount } = defineProps<{
  action: ConnectionAction
  count: number
  scope: SrScope
  accessMode: SrAccessMode
  hostsCount: number
}>()

const { t } = useI18n()

const { title, info } = useSrModalMessages({
  action,
  count: () => count,
  scope: () => scope,
  accessMode: () => accessMode,
  hostsCount: () => hostsCount,
})

const confirmLabel = useMapper(
  () => action,
  () => ({
    [CONNECTION_ACTION.CONNECT]: t('action:connect-n-srs', { n: count }),
    [CONNECTION_ACTION.DISCONNECT]: t('action:disconnect-n-srs', { n: count }),
  }),
  CONNECTION_ACTION.CONNECT
)
</script>
