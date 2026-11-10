<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <BackupRepositoryDetailGeneralInfo :br :parsed-br-url />
      <BackupRepositoryDetailLocal v-if="parsedBrUrl?.type === 'file'" :file="parsedBrUrl" />
      <BackupRepositoryDetailNfs v-else-if="parsedBrUrl?.type === 'nfs'" :nfs="parsedBrUrl" :options="br.options" />
      <BackupRepositoryDetailSmb v-else-if="parsedBrUrl?.type === 'smb'" :smb="parsedBrUrl" :options="br.options" />
      <BackupRepositoryDetailS3 v-else-if="parsedBrUrl?.type === 's3'" :s3="parsedBrUrl" />
      <BackupRepositoryDetailAzureAzurite
        v-else-if="parsedBrUrl?.type === 'azure' || parsedBrUrl?.type === 'azurite'"
        :azure="parsedBrUrl"
      />
    </VtsColumn>
    <VtsColumn>
      <BackupRepositoryDetailSpeed :br />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import BackupRepositoryDetailAzureAzurite from '@/modules/backup-repository/components/detail/BackupRepositoryDetailAzureAzurite.vue'
import BackupRepositoryDetailGeneralInfo from '@/modules/backup-repository/components/detail/BackupRepositoryDetailGeneralInfo.vue'
import BackupRepositoryDetailLocal from '@/modules/backup-repository/components/detail/BackupRepositoryDetailLocal.vue'
import BackupRepositoryDetailNfs from '@/modules/backup-repository/components/detail/BackupRepositoryDetailNfs.vue'
import BackupRepositoryDetailS3 from '@/modules/backup-repository/components/detail/BackupRepositoryDetailS3.vue'
import BackupRepositoryDetailSmb from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSmb.vue'
import BackupRepositoryDetailSpeed from '@/modules/backup-repository/components/detail/BackupRepositoryDetailSpeed.vue'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
</script>
