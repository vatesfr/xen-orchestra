<template>
  <MenuItem
    icon="action:delete"
    class="delete"
    :disabled="!canDeleteVdi"
    :busy="isDeletingVdi"
    @click="openVdiDeleteModal()"
  >
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiDeleteModal } from '@/modules/vdi/composables/use-vdi-delete-modal.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm?: FrontXoVm
}>()

const { t } = useI18n()

const {
  openModal: openVdiDeleteModal,
  canRun: canDeleteVdi,
  isRunning: isDeletingVdi,
  errorMessage: deleteVdiErrorMessage,
} = useVdiDeleteModal(
  () => [vdi],
  () => vm
)

const hint = computed(() => (!canDeleteVdi.value ? deleteVdiErrorMessage.value : undefined))
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
