<template>
  <MenuItem icon="action:disconnect" :disabled="!canDeleteVbd" :busy="isDeletingVbd" @click="openVdiDetachModal()">
    {{ t('action:detach') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useVdiDetachModal } from '@/modules/vdi/composables/use-vdi-detach-modal.composable.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vbd } = defineProps<{
  vbd: FrontXoVbd
}>()

const { t } = useI18n()

const {
  openModal: openVdiDetachModal,
  canRun: canDeleteVbd,
  isRunning: isDeletingVbd,
} = useVdiDetachModal(() => (vbd ? [vbd] : []))
</script>
