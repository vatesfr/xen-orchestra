<template>
  <MenuItem icon="action:delete" :disabled="!canDeleteVdi" :busy="isDeletingVdi" @click="openVdiDeleteModal()">
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
    <i v-if="hintNoVM">{{ hintNoVM }}</i>
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
} = useVdiDeleteModal(
  () => [vdi],
  () => vm as FrontXoVm
)

const hint = computed(() => (vm && !canDeleteVdi.value ? t('vm-running') : undefined))
const hintNoVM = computed(() => (!vm ? t('vdi-not-attached-to-VM') : undefined))
</script>
