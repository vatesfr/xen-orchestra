<template>
  <UiButton
    v-tooltip="!canConnectSr && connectSrErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectSr"
    left-icon="action:connect"
    :busy="isConnectingSr"
    @click="openSrConnectModal()"
  >
    {{ t('action:connect') }}
    <UiCounter
      v-if="isPartiallyConnectedInScope"
      :value="targetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
  </UiButton>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useSrConnectModal } from '@/modules/storage-repository/composables/use-sr-connect-modal.composable.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: XenApiSr
  scope: SrScope
}>()

const { isPartiallyConnectedInScope } = useSrUtils(
  () => sr,
  () => scope
)

const { t } = useI18n()

const {
  openModal: openSrConnectModal,
  canRun: canConnectSr,
  isRunning: isConnectingSr,
  errorMessage: connectSrErrorMessage,
  targetCount,
} = useSrConnectModal(
  () => [sr],
  () => scope
)
</script>
