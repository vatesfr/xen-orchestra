<template>
  <UiButton
    v-tooltip="!canConnectSrs && connectSrsErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectSrs"
    left-icon="action:connect"
    :busy="isConnectingSrs"
    @click="connectSrs()"
  >
    {{ t('action:connect') }}
    <UiCounter
      v-if="isPartiallyConnectedInScope"
      :value="connectionTargetCount"
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

const { connectSrs, canConnectSrs, isConnectingSrs, connectSrsErrorMessage, connectionTargetCount } = useSrConnection({
  srs: () => [sr],
  scope: () => scope,
})
</script>
