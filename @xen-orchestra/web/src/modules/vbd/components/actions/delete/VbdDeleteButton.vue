<template>
  <MenuItem icon="action:detach" :disabled="!canDeleteVbd" :busy="isDeletingVbd" @click="openVbdDeleteModal()">
    {{ menuLabel }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdDeleteModal } from '@/modules/vbd/composables/use-vbd-delete-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  vbd,
  vm,
  isVdiPage = false,
} = defineProps<{
  vbd: FrontXoVbd
  vm: FrontXoVm
  isVdiPage?: boolean
}>()

const { t } = useI18n()

const {
  openModal: openVbdDeleteModal,
  canRun: canDeleteVbd,
  isRunning: isDeletingVbd,
} = useVbdDeleteModal(
  () => [vbd],
  () => vm
)

const menuLabel = computed(() => {
  return isVdiPage ? t('action:detach-vdi') : t('action:delete-vbd')
})

const hint = computed(() => (!canDeleteVbd.value ? t('vm-running') : undefined))
</script>
