<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <BackupRepositoryInfosCard :br />
      <BackupRepositorySpaceAndSpeedCard :br />
      <BackupRepositoryLocalCard v-if="brInfo?.type === 'file'" :file="brInfo" />
      <BackupRepositoryNfsCard v-else-if="brInfo?.type === 'nfs'" :nfs="brInfo" :options="br.options" />
      <BackupRepositorySmbCard v-else-if="brInfo?.type === 'smb'" :smb="brInfo" :options="br.options" />
      <BackupRepositoryS3Card v-else-if="brInfo?.type === 's3'" :s3="brInfo" />
      <BackupRepositoryAzureCard v-else-if="brInfo?.type === 'azure' || brInfo?.type === 'azurite'" :azure="brInfo" />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryAzureAzuriteCard.vue'
import BackupRepositoryInfosCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryInfosCard.vue'
import BackupRepositoryLocalCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryLocalCard.vue'
import BackupRepositoryNfsCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryNfsCard.vue'
import BackupRepositoryS3Card from '@/modules/backup/components/repository/list/panel/cards/BackupRepositoryS3Card.vue'
import BackupRepositorySmbCard from '@/modules/backup/components/repository/list/panel/cards/BackupRepositorySmbCard.vue'
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

const brInfo = computed(() => (br === undefined ? undefined : parseBackupRepositoryUrl(br.url)))
</script>
