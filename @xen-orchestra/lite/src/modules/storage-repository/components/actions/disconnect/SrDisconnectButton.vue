<template>
  <MenuItem
    v-tooltip="!canDisconnectSrs && disconnectSrsErrorMessage"
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
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrConnection } from '@/modules/storage-repository/composables/use-sr-connection.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { type SrScope } from '@core/types/storage-repository.type.ts'
import { shouldShowTargetCount } from '@core/utils/sr.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: XenApiSr
  scope: SrScope
}>()

const { t } = useI18n()

const { disconnectSrs, canDisconnectSrs, isDisconnectingSrs, disconnectSrsErrorMessage, disconnectionTargetCount } =
  useSrConnection({
    srs: () => [sr],
    scope: () => scope,
  })

const hint = computed(() => (!canDisconnectSrs.value ? disconnectSrsErrorMessage.value : undefined))
</script>
