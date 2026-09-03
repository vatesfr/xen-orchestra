<template>
  <div class="new-backup-repository-details-step">
    <BackupRepositoryLocalFields v-if="type === 'file'" :bindings="details.file.bindings" />
    <BackupRepositoryNfsFields v-else-if="type === 'nfs'" :bindings="details.nfs.bindings" />
    <BackupRepositorySmbFields v-else-if="type === 'smb'" :bindings="details.smb.bindings" />
    <BackupRepositoryS3Fields v-else-if="type === 's3'" :bindings="details.s3.bindings" />
    <BackupRepositoryAzureFields
      v-else-if="type === 'azure' || type === 'azurite'"
      :bindings="details.azure.bindings"
      :is-azurite="type === 'azurite'"
    />
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureFields from '@/modules/backup/components/repository/form/fields/BackupRepositoryAzureFields.vue'
import BackupRepositoryLocalFields from '@/modules/backup/components/repository/form/fields/BackupRepositoryLocalFields.vue'
import BackupRepositoryNfsFields from '@/modules/backup/components/repository/form/fields/BackupRepositoryNfsFields.vue'
import BackupRepositoryS3Fields from '@/modules/backup/components/repository/form/fields/BackupRepositoryS3Fields.vue'
import BackupRepositorySmbFields from '@/modules/backup/components/repository/form/fields/BackupRepositorySmbFields.vue'
import type { NewBackupRepositoryDetailsForms } from '@/modules/backup/form/use-new-backup-repository-form.js'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.js'

defineProps<{
  type: BackupRepositoryType | undefined
  details: NewBackupRepositoryDetailsForms
}>()
</script>

<style lang="postcss" scoped>
.new-backup-repository-details-step {
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
