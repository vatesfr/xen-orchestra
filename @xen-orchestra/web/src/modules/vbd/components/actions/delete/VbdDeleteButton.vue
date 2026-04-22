<template>
  <MenuItem icon="action:disconnect" :disabled="!canDeleteVbd" :busy="isDeletingVbd" @click="openVbdDeleteModal()">
    {{ t('action:delete-vbd') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVbdDeleteModal } from '@/modules/vbd/composables/use-vbd-delete-modal.composable.ts'
import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.js'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vbd } = defineProps<{
  vbd: FrontXoVbd
}>()

const { t } = useI18n()

const {
  openModal: openVbdDeleteModal,
  canRun: canDeleteVbd,
  isRunning: isDeletingVbd,
} = useVbdDeleteModal(() => (vbd ? [vbd] : []))

const hint = computed(() => (!canDeleteVbd.value ? t('running-vm') : undefined))
</script>
