<template>
  <MenuItem icon="action:import-export">
    {{ t('action:import-export') }}
    <template #submenu>
      <VdiExportButton :vdi />
    </template>
  </MenuItem>
</template>

<script lang="ts" setup>
import VdiExportButton from '@/modules/vdi/components/actions/import-export/export/VdiExportButton.vue'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()
</script>
