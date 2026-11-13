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
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { SrScope } from '@core/types/storage-repository.type.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { isPartiallyConnectedInScope } = useXoSrUtils(
  () => sr,
  () => scope
)

const { t } = useI18n()

const { connectSrs, canConnectSrs, isConnectingSrs, connectSrsErrorMessage, connectionTargetCount } = useSrConnection({
  srs: () => [sr],
  scope: () => scope,
})
</script>
