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
        {{ t('action:disconnect-n-srs', { n: count }) }}
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
import { CONNECTION_ACTION } from '@core/types/connection.type.ts'
import { useI18n } from 'vue-i18n'

const { count, scope, accessMode, hostsCount } = defineProps<{
  count: number
  scope: SrScope
  accessMode: SrAccessMode
  hostsCount: number
}>()

const { t } = useI18n()

const { title, info } = useSrModalMessages({
  action: CONNECTION_ACTION.DISCONNECT,
  count: () => count,
  scope: () => scope,
  accessMode: () => accessMode,
  hostsCount: () => hostsCount,
})
</script>
