<template>
  <VtsActionButton
    :hint="connectSrsErrorMessage"
    variant="tertiary"
    accent="brand"
    :disabled="!canConnectSrs"
    icon="action:connect"
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
  </VtsActionButton>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrUtils } from '@/modules/storage-repository/composables/sr-utils.composable.ts'
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
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
