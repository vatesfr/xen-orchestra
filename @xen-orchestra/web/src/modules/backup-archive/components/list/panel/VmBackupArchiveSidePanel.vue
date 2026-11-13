<template>
  <VtsSidePanel :has-selection="!!backupArchive" @close="emit('close')">
    <template v-if="backupArchive">
      <VmBackupArchiveInfosCard :backup-archive />
      <VmBackupArchivePropertiesCard :backup-archive />
      <VmBackupArchiveVdisCard v-if="backupArchive.disks.length > 0" :backup-archive />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import VmBackupArchiveInfosCard from '@/modules/backup-archive/components/list/panel/cards/VmBackupArchiveInfosCard.vue'
import VmBackupArchivePropertiesCard from '@/modules/backup-archive/components/list/panel/cards/VmBackupArchivePropertiesCard.vue'
import VmBackupArchiveVdisCard from '@/modules/backup-archive/components/list/panel/cards/VmBackupArchiveVdisCard.vue'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { backupArchive } = defineProps<{
  backupArchive?: FrontXoVmBackupArchive
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
