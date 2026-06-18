<template>
  <MenuItem
    icon="action:disconnect"
    :disabled="!canDisconnectSr"
    :busy="isDisconnectingSr"
    @click="openSrDisconnectModal()"
  >
    {{ t('action:disconnect') }}
    <UiCounter
      v-if="targetCount > (scope.type === SR_SCOPE_TYPE.POOL ? 0 : 1)"
      :value="targetCount"
      accent="brand"
      variant="secondary"
      size="small"
    />
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrDisconnectModal } from '@/modules/storage-repository/composables/use-sr-disconnect-modal.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { SR_SCOPE_TYPE, type SrScope } from '@core/types/storage-repository.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { sr, scope } = defineProps<{
  sr: XenApiSr
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

const hint = computed(() => (!canDisconnectSr.value ? disconnectSrErrorMessage.value : undefined))
</script>
