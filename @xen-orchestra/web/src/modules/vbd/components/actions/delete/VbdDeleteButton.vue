<template>
  <MenuItem icon="action:detach" :disabled="!canDeleteVbd" :busy="isDeletingVbd" @click="deleteVbds()">
    {{ t('action:detach-vdi') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdDelete } from '@/modules/vbd/composables/use-vbd-delete.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vbd, vm } = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
}>()

const { t } = useI18n()

const {
  deleteVbds,
  canRun: canDeleteVbd,
  isRunning: isDeletingVbd,
} = useVbdDelete(
  () => [vbd],
  () => vm
)

const hint = computed(() => (!canDeleteVbd.value ? t('vm-running') : undefined))
</script>
