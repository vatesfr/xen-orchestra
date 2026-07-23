<template>
  <VtsModal accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ connection.title }}
    </template>

    <template v-if="action === CONNECTION_ACTION.DISCONNECT" #content>
      {{ t('vdi-disconnect-info') }}
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
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
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
    connect: { title: t('vdi-connect-title', { n: count }), action: t('action:connect-n-vdis', { n: count }) },
    disconnect: { title: t('vdi-disconnect-title', { n: count }), action: t('action:disconnect-n-vdis', { n: count }) },
  }),
  'connect'
)
</script>
