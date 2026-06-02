<template>
  <UiButton
    v-tooltip="!canDisconnectSr && disconnectSrErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canDisconnectSr"
    left-icon="action:disconnect"
    :busy="isDisconnectingSr"
    @click="openSrDisconnectModal()"
  >
    {{ t('action:disconnect') }}
    <UiCounter
      v-if="targetCount > (scope.type === 'pool' ? 0 : 1)"
      :value="targetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
  </UiButton>
</template>

<script lang="ts" setup>
import { useSrDisconnectModal } from '@/modules/storage-repository/composables/use-sr-disconnect-modal.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrScope } from '@/modules/storage-repository/types/storage-repository.type'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { t } = useI18n()

const {
  openModal: openSrDisconnectModal,
  canRun: canDisconnectSr,
  isRunning: isDisconnectingSr,
  errorMessage: disconnectSrErrorMessage,
  targetCount,
} = useSrDisconnectModal(
  () => [sr],
  () => scope
)
</script>
