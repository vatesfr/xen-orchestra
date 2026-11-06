<template>
  <MenuItem accent="danger" icon="action:delete" :disabled="!canDeleteVif" :busy="isDeletingVif" @click="deleteVif()">
    {{ t('action:delete') }}
    <i v-if="!canDeleteVif">{{ deleteVifErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useVifDelete } from '@/modules/vif/composables/use-vif-delete.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif: XenApiVif
}>()

const { t } = useI18n()

const { deleteVif, canDeleteVif, isDeletingVif, deleteVifErrorMessage } = useVifDelete(() => vif)
</script>
