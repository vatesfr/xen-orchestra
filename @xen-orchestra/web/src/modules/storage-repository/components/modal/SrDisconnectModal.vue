<template>
  <UiModal accent="info" icon="status:info-picto" @dismiss="emit('cancel')" @confirm="emit('confirm')">
    <template #title>
      {{ title }}
    </template>

    <template #content>
      {{ info }}
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')">{{ t('action:go-back') }}</VtsOverlayCancelButton>
      <VtsOverlayConfirmButton>
        {{ t('action:disconnect-n-srs', { n: count }) }}
      </VtsOverlayConfirmButton>
    </template>
  </UiModal>
</template>

<script lang="ts" setup>
import { useSrModalMessages } from '@/modules/storage-repository/composables/use-sr-modal-messages.composable.ts'
import type { SrAccessMode, SrScope } from '@core/types/storage-repository.type.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiModal from '@core/components/ui/modal/UiModal.vue'
import { CONNECTION_ACTION } from '@core/types/connection.ts'
import { useI18n } from 'vue-i18n'

const { count, scope, accessMode, hostsCount } = defineProps<{
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

const { title, info } = useSrModalMessages({
  action: CONNECTION_ACTION.DISCONNECT,
  count: () => count,
  scope: () => scope,
  accessMode: () => accessMode,
  hostsCount: () => hostsCount,
})
</script>
