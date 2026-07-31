<template>
  <MenuItem
    v-tooltip="!canDeleteSr && deleteSrErrorMessage"
    icon="action:delete"
    :disabled="!canDeleteSr"
    :busy="isDeletingSr"
    class="delete"
    @click="deleteSrs()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrDelete } from '@/modules/storage-repository/composables/use-sr-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XenApiSr
}>()

const { t } = useI18n()

const {
  deleteSrs,
  canRun: canDeleteSr,
  isRunning: isDeletingSr,
  errorMessage: deleteSrErrorMessage,
} = useSrDelete(() => [sr])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
