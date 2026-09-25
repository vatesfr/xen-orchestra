<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <BackupRepositoryGeneralInfo :br :parsed-br-url="parsedBrUrl" />
      <BackupRepositoryLocalDetails v-if="parsedBrUrl?.type === 'file'" :file="parsedBrUrl" />
      <BackupRepositoryNfsDetails v-else-if="parsedBrUrl?.type === 'nfs'" :nfs="parsedBrUrl" :options="br.options" />
      <BackupRepositorySmbDetails v-else-if="parsedBrUrl?.type === 'smb'" :smb="parsedBrUrl" :options="br.options" />
      <BackupRepositoryS3Details v-else-if="parsedBrUrl?.type === 's3'" :s3="parsedBrUrl" />
      <BackupRepositoryAzureDetails v-else-if="parsedBrUrl?.type === 'azure'" :azure="parsedBrUrl" />
      <BackupRepositoryAzuriteDetails v-else-if="parsedBrUrl?.type === 'azurite'" :azurite="parsedBrUrl" />
    </VtsColumn>
    <VtsColumn>
      <BackupRepositorySpeed :br />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import BackupRepositoryAzureDetails from '@/modules/backup-repository/components/detail/BackupRepositoryAzureDetails.vue'
import BackupRepositoryAzuriteDetails from '@/modules/backup-repository/components/detail/BackupRepositoryAzuriteDetails.vue'
import BackupRepositoryGeneralInfo from '@/modules/backup-repository/components/detail/BackupRepositoryGeneralInfo.vue'
import BackupRepositoryLocalDetails from '@/modules/backup-repository/components/detail/BackupRepositoryLocalDetails.vue'
import BackupRepositoryNfsDetails from '@/modules/backup-repository/components/detail/BackupRepositoryNfsDetails.vue'
import BackupRepositoryS3Details from '@/modules/backup-repository/components/detail/BackupRepositoryS3Details.vue'
import BackupRepositorySmbDetails from '@/modules/backup-repository/components/detail/BackupRepositorySmbDetails.vue'
import BackupRepositorySpeed from '@/modules/backup-repository/components/detail/BackupRepositorySpeed.vue'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedBrUrl = useXoBackupRepositoryParsedUrl(() => br)
</script>
