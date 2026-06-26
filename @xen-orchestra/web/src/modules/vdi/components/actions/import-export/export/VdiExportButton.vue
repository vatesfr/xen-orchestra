<template>
  <MenuItem icon="action:download" :busy="isExportingVdi" @click="openVdiExportDrawer()">
    {{ t('action:export-content') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiExportDrawer } from '@/modules/vdi/composables/use-vdi-export-drawer.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { openDrawer: openVdiExportDrawer, isRunning: isExportingVdi } = useVdiExportDrawer(() => vdi)
</script>
