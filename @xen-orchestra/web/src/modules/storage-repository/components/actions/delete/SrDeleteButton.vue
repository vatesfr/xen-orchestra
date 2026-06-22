<template>
  <MenuItem
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
import { useSrDeleteModal } from '@/modules/storage-repository/composables/use-sr-delete-modal.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { t } = useI18n()

const { openModal: openSrDeleteModal, canRun: canDeleteSr, isRunning: isDeletingSr } = useSrDeleteModal(() => [sr])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
