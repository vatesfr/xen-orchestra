<template>
  <UiButton
    v-tooltip="!canConnectSr && connectSrErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectSr"
    left-icon="action:connect"
    :busy="isConnectingSr"
    @click="connectSr()"
  >
    {{ t('action:connect') }}
    <UiCounter
      v-if="isPartiallyConnectedInScope"
      :value="connectTargetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
  </UiButton>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
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

const { connectSr, canConnectSr, isConnectingSr, connectSrErrorMessage, connectTargetCount } = useSrConnection({
  srs: () => [sr],
  scope: () => scope,
})
</script>
