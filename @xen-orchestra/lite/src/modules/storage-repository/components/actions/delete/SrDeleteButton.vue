<template>
  <MenuItem
    v-tooltip="!canDeleteSrs && deleteSrsErrorMessage"
    accent="danger"
    icon="action:delete"
    :disabled="!canDeleteSrs"
    :busy="isDeletingSrs"
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

const { deleteSrs, canDeleteSrs, isDeletingSrs, deleteSrsErrorMessage } = useSrDelete(() => [sr])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
