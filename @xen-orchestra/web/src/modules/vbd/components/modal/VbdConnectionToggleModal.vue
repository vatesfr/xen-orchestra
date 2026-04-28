<template>
  <VtsModal accent="info" icon="status:info-picto">
    <template #title>
      {{ connection.title }}
    </template>

    <template v-if="action === CONNECTION_ACTION.DISCONNECT" #content>
      {{ t('vbd-disconnect-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ connection.action }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import type { VbdConnectionAction } from '@/modules/vbd/composables/use-vbd-connection-toggle-modal.composable.ts'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useMapper } from '@core/packages/mapper'
import { useI18n } from 'vue-i18n'

const { action, count } = defineProps<{
  action: VbdConnectionAction
  count: number
}>()

const { t } = useI18n()

const connection = useMapper(
  () => action,
  () => ({
    connect: { title: t('vbd-connect-title', { n: count }), action: t('action:connect-n-vbds', { n: count }) },
    disconnect: { title: t('vbd-disconnect-title', { n: count }), action: t('action:disconnect-n-vbds', { n: count }) },
  }),
  'connect'
)
</script>
