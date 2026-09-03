<template>
  <MenuItem accent="brand" icon="action:detach" :disabled="!canDeleteVbds" :busy="isDeletingVbds" @click="deleteVbds()">
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

const { deleteVbds, canDeleteVbds, isDeletingVbds } = useVbdDelete({
  vbds: () => [vbd],
  vm: () => vm,
})

const hint = computed(() => (!canDeleteVbds.value ? t('vm-running') : undefined))
</script>
