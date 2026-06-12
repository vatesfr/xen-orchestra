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
        {{ t('action:connect-n-srs', { n: count }) }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import { useSrModalMessages } from '@/modules/storage-repository/composables/use-sr-modal-messages.composable.ts'
import type { SrAccessMode, SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import VtsModal from '@core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const { count, scope, accessMode, hostsCount } = defineProps<{
  count: number
  scope: SrScope
  accessMode: SrAccessMode
  hostsCount: number
}>()

const { t } = useI18n()

const { title, info } = useSrModalMessages({
  action: CONNECTION_ACTION.CONNECT,
  count: () => count,
  scope: () => scope,
  accessMode: () => accessMode,
  hostsCount: () => hostsCount,
})
</script>
