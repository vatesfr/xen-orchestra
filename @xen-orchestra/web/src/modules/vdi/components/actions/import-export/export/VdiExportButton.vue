<template>
  <MenuItem accent="brand" icon="action:download" :busy="isExportingVdi" @click="exportVdi()">
    {{ t('action:export-content') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiExport } from '@/modules/vdi/composables/use-vdi-export.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { exportVdi, isExportingVdi } = useVdiExport(() => vdi)
</script>
