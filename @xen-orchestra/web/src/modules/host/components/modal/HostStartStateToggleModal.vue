<template>
  <VtsModal accent="warning" icon="status:warning-picto">
    <template #title>
      {{ enabledState.title }}
    </template>

    <template v-if="action === ENABLED_STATE_ACTION.DISABLE" #content>
      {{ t('host-disable-info') }}
    </template>

    <template #buttons>
      <VtsModalCancelButton>{{ t('action:go-back') }}</VtsModalCancelButton>
      <VtsModalConfirmButton>
        {{ enabledState.action }}
      </VtsModalConfirmButton>
    </template>
  </VtsModal>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

import { ENABLED_STATE_ACTION, type EnabledStateAction } from '@/modules/host/types/enabled-state.ts'
import { useMapper } from '@core/packages/mapper'
import VtsModal from '@xen-orchestra/web-core/components/modal/VtsModal.vue'
import VtsModalCancelButton from '@xen-orchestra/web-core/components/modal/VtsModalCancelButton.vue'
import VtsModalConfirmButton from '@xen-orchestra/web-core/components/modal/VtsModalConfirmButton.vue'
import { useI18n } from 'vue-i18n'

const { action, host } = defineProps<{
  action: EnabledStateAction
  host: FrontXoHost
}>()

const { t } = useI18n()

const enabledState = useMapper(
  () => action,
  () => ({
    start: { title: t('host-start-title', { host: host.name_label }), action: t('action:host-enable') },
    shutdown: { title: t('host-shutdown-title', { host: host.name_label }), action: t('action:host-disable') },
  }),
  'disable'
)
</script>
