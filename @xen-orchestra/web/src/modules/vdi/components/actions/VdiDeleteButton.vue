<template>
  <MenuItem
    icon="action:delete"
    :disabled="!canDeleteVdi"
    :busy="isDeletingVdi"
    class="delete"
    @click="openVdiDeleteModal()"
  >
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiDeleteModal } from '@/modules/vdi/composables/use-vdi-delete-modal.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { openModal: openVdiDeleteModal, canRun: canDeleteVdi, isRunning: isDeletingVdi } = useVdiDeleteModal(() => [vdi])
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
