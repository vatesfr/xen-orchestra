<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <BackupRepositoryInfosCard :br />
      <BackupRepositorySpaceAndSpeedCard :br />
      <BackupRepositoryNfsCard v-if="nfs" :nfs />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryInfosCard.vue'
import BackupRepositoryNfsCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryNfsCard.vue'
import BackupRepositorySpaceAndSpeedCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySpaceAndSpeedCard.vue'
import { type FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { parseBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const nfs = computed(() => {
  const parsed = br === undefined ? undefined : parseBackupRepositoryUrl(br.url)

  return parsed?.type === 'nfs' ? parsed : undefined
})
</script>
