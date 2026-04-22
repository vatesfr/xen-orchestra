<template>
  <MenuItem icon="action:delete" :disabled="!canDeleteVif" :busy="isDeletingVif" @click="openVifDeleteModal()">
    {{ t('action:delete') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVifDeleteModal } from '@/modules/vif/composables/use-vif-delete-modal.composable.ts'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.js'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: FrontXoVif
}>()

const { t } = useI18n()

const {
  openModal: openVifDeleteModal,
  canRun: canDeleteVif,
  isRunning: isDeletingVif,
} = useVifDeleteModal(() => (vif ? [vif] : []))

const hint = computed(() => (!canDeleteVif.value ? t('vif-connected') : undefined))
</script>
