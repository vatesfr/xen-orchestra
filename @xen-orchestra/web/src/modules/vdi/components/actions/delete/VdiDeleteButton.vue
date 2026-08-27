<template>
  <MenuItem icon="action:delete" class="delete" :disabled="!canDeleteVdis" :busy="isDeletingVdis" @click="deleteVdis()">
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi, vm } = defineProps<{
  vdi: FrontXoVdi
  vm?: FrontXoVm
}>()

const { t } = useI18n()

const {
  deleteVdis,
  canDeleteVdis,
  isDeletingVdis,
  deleteVdisErrorMessage: hint,
} = useVdiDelete({
  vdis: () => [vdi],
  vm: () => vm,
})
</script>

<style lang="postcss" scoped>
.delete {
  color: var(--color-danger-item-base);
}
</style>
