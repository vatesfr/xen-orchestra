<template>
  <VtsSidePanel :has-selection="!!br" @close="emit('close')">
    <template v-if="br" #default>
      <BackupRepositoryInfosCard :br :parsed-br-url />
      <BackupRepositorySpaceAndSpeedCard :br />
      <BackupRepositoryLocalCard v-if="parsedBrUrl?.type === 'file'" :file="parsedBrUrl" />
      <BackupRepositoryNfsCard v-else-if="parsedBrUrl?.type === 'nfs'" :nfs="parsedBrUrl" :options="br.options" />
      <BackupRepositorySmbCard v-else-if="parsedBrUrl?.type === 'smb'" :smb="parsedBrUrl" :options="br.options" />
      <BackupRepositoryS3Card v-else-if="parsedBrUrl?.type === 's3'" :s3="parsedBrUrl" />
      <BackupRepositoryAzureCard
        v-else-if="parsedBrUrl?.type === 'azure' || parsedBrUrl?.type === 'azurite'"
        :azure="parsedBrUrl"
      />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryAzureAzuriteCard.vue'
import BackupRepositoryInfosCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryInfosCard.vue'
import BackupRepositoryLocalCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryLocalCard.vue'
import BackupRepositoryNfsCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryNfsCard.vue'
import BackupRepositoryS3Card from '@/modules/backup-repository/components/list/panel/cards/BackupRepositoryS3Card.vue'
import BackupRepositorySmbCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositorySmbCard.vue'
import BackupRepositorySpaceAndSpeedCard from '@/modules/backup-repository/components/list/panel/cards/BackupRepositorySpaceAndSpeedCard.vue'
import { type FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import { computed } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

const { br } = defineProps<{
  br?: FrontXoBackupRepository
}>()

const emit = defineEmits<{
  close: []
}>()

const parsedBrUrl = computed(() => (br === undefined ? undefined : parseBackupRepositoryUrl(br.url)))
</script>
