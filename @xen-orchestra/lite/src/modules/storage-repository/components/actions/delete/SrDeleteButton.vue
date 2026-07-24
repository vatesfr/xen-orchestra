<template>
  <MenuItem
    v-tooltip="!canDeleteSr && deleteSrErrorMessage"
    icon="action:delete"
    :disabled="!canDeleteSr"
    :busy="isDeletingSr"
    class="delete"
    @click="openSrDeleteModal()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiSr } from '@/libs/xen-api/xen-api.types.ts'
import { useSrDeleteModal } from '@/modules/storage-repository/composables/use-sr-delete-modal.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: XenApiSr
}>()

const { t } = useI18n()

const {
  openModal: openSrDeleteModal,
  canRun: canDeleteSr,
  isRunning: isDeletingSr,
  errorMessage: deleteSrErrorMessage,
} = useSrDeleteModal(() => [sr])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
