<template>
  <VtsActionButton
    :hint="disconnectSrsErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:disconnect"
    :disabled="!canDisconnectSrs"
    :busy="isDisconnectingSrs"
    @click="disconnectSrs()"
  >
    {{ t('action:disconnect') }}
    <UiCounter
      v-if="shouldShowTargetCount(scope, disconnectionTargetCount)"
      :value="disconnectionTargetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { type SrScope } from '@core/types/storage-repository.type.ts'
import { shouldShowTargetCount } from '@core/utils/sr.utils.ts'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: FrontXoSr
  scope: SrScope
}>()

const { t } = useI18n()

const { disconnectSrs, canDisconnectSrs, isDisconnectingSrs, disconnectSrsErrorMessage, disconnectionTargetCount } =
  useSrConnection({
    srs: () => [sr],
    scope: () => scope,
  })
</script>
