<template>
  <MenuItem icon="action:delete" :busy="isDeletingVm" accent="danger" @click="deleteVm()">
    {{ t('action:delete') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmDelete } from '@/modules/vm/composables/use-vm-delete.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { deleteVm, isDeletingVm } = useVmDelete(() => vm)
</script>
