<template>
  <MenuItem
    icon="action:delete"
    accent="danger"
    :disabled="!canDeleteVdis"
    :busy="isDeletingVdis"
    @click="deleteVdis()"
  >
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiDelete } from '@/modules/vdi/composables/use-vdi-delete.composable.ts'
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

const { deleteVdis, canDeleteVdis, isDeletingVdis } = useVdiDelete({
  vdis: () => [vdi],
  vm: () => vm,
})

const hint = computed(() => {
  if (!vm) {
    return t('vdi-not-attached-to-vm')
  }
  if (!canDeleteVdis.value) {
    return t('vm-running')
  }
  return undefined
})
</script>
