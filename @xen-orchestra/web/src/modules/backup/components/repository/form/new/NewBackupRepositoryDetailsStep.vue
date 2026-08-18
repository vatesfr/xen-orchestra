<template>
  <div class="new-backup-repository-details-step">
    <BackupRepositoryAzureFields
      v-if="type === 'azure' || type === 'azurite'"
      :host-name-input-bindings="azureHostNameInputBindings"
      :account-name-input-bindings="azureAccountNameInputBindings"
      :key-input-bindings="azureKeyInputBindings"
      :container-name-input-bindings="azureContainerNameInputBindings"
      :path-in-container-input-bindings="azurePathInContainerInputBindings"
    />
    <BackupRepositoryNfsFields
      v-else-if="type === 'nfs'"
      :host-input-bindings="nfsHostInputBindings"
      :port-input-bindings="nfsPortInputBindings"
      :path-input-bindings="nfsPathInputBindings"
      :custom-options-input-bindings="nfsCustomOptionsInputBindings"
    />
    <BackupRepositoryLocalFields v-else-if="type === 'file'" :path-input-bindings="localPathInputBindings" />
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryAzureFields.vue'
import BackupRepositoryLocalFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryLocalFields.vue'
import BackupRepositoryNfsFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryNfsFields.vue'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

type TextInputBindings = ModelBinding<string> & FieldMetadata & { label: string; required?: boolean }

defineProps<{
  type: BackupRepositoryType | undefined
  azureHostNameInputBindings: TextInputBindings
  azureAccountNameInputBindings: TextInputBindings
  azureKeyInputBindings: TextInputBindings
  azureContainerNameInputBindings: TextInputBindings
  azurePathInContainerInputBindings: TextInputBindings
  nfsHostInputBindings: TextInputBindings
  nfsPortInputBindings: TextInputBindings
  nfsPathInputBindings: TextInputBindings
  nfsCustomOptionsInputBindings: TextInputBindings
  localPathInputBindings: TextInputBindings
}>()
</script>

<style lang="postcss" scoped>
.new-backup-repository-details-step {
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
