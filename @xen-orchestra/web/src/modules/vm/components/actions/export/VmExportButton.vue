<template>
  <MenuItem icon="action:download" @click="openDrawer()">
    {{ t('action:export') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmExportDrawer } from '@/modules/vm/composables/use-vm-export-drawer.composable'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openDrawer } = useVmExportDrawer(() => vm)
</script>
