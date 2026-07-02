<template>
  <VtsOverlay type="modal" accent="info" icon="status:info-picto" dismissible>
    <template #title>
      {{ title }}
    </template>

    <template #content>
      {{ info }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton>{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ t('action:disconnect-n-srs', { n: count }) }}
      </VtsOverlayConfirmButton>
    </template>
  </VtsOverlay>
</template>

<script lang="ts" setup>
import { useSrModalMessages } from '@/modules/storage-repository/composables/use-sr-modal-messages.composable.ts'
import type { SrAccessMode, SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import { CONNECTION_ACTION } from '@/shared/constants.ts'
import VtsOverlay from '@core/components/overlay/VtsOverlay.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
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
