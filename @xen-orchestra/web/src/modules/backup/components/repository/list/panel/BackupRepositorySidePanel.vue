<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <BackupRepositoryInfosCard :br :parsed-br-url />
      <BackupRepositorySpeedCard :br />
      <BackupRepositoryLocalCard v-if="parsedBrUrl?.type === 'file'" :file="parsedBrUrl" />
      <BackupRepositoryNfsCard v-else-if="parsedBrUrl?.type === 'nfs'" :nfs="parsedBrUrl" :options="br.options" />
      <BackupRepositorySmbCard v-else-if="parsedBrUrl?.type === 'smb'" :smb="parsedBrUrl" :options="br.options" />
      <BackupRepositoryS3Card v-else-if="parsedBrUrl?.type === 's3'" :s3="parsedBrUrl" />
      <BackupRepositoryAzureAzuriteCard
        v-else-if="parsedBrUrl?.type === 'azure' || parsedBrUrl?.type === 'azurite'"
        :azure="parsedBrUrl"
      />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureAzuriteCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryAzureAzuriteCard.vue'
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryInfosCard.vue'
import BackupRepositoryLocalCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryLocalCard.vue'
import BackupRepositoryNfsCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryNfsCard.vue'
import BackupRepositoryS3Card from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryS3Card.vue'
import BackupRepositorySmbCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySmbCard.vue'
import BackupRepositorySpeedCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySpeedCard.vue'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { type FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { br } = defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
</script>
