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
    <BackupRepositorySmbFields
      v-else-if="type === 'smb'"
      :path-on-share-input-bindings="smbPathOnShareInputBindings"
      :subfolder-input-bindings="smbSubfolderInputBindings"
      :username-input-bindings="smbUsernameInputBindings"
      :password-input-bindings="smbPasswordInputBindings"
      :domain-input-bindings="smbDomainInputBindings"
      :custom-options-input-bindings="smbCustomOptionsInputBindings"
    />
    <BackupRepositoryS3Fields
      v-else-if="type === 's3'"
      :endpoint-input-bindings="s3EndpointInputBindings"
      :use-https-checkbox-bindings="s3UseHttpsCheckboxBindings"
      :allow-unauthorized-checkbox-bindings="s3AllowUnauthorizedCheckboxBindings"
      :region-input-bindings="s3RegionInputBindings"
      :access-key-id-input-bindings="s3AccessKeyIdInputBindings"
      :secret-input-bindings="s3SecretInputBindings"
      :bucket-input-bindings="s3BucketInputBindings"
      :path-in-bucket-input-bindings="s3PathInBucketInputBindings"
    />
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryAzureFields.vue'
import BackupRepositoryLocalFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryLocalFields.vue'
import BackupRepositoryNfsFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryNfsFields.vue'
import BackupRepositoryS3Fields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryS3Fields.vue'
import BackupRepositorySmbFields from '@/modules/backup/components/repository/form/new/fields/BackupRespositorySmbFields.vue'
import type { BackupRepositoryType } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

type TextInputBindings = ModelBinding<string> & FieldMetadata & { label: string; required?: boolean }
type CheckboxBindings = ModelBinding<boolean> & FieldMetadata & { label: string }

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
  smbPathOnShareInputBindings: TextInputBindings
  smbSubfolderInputBindings: TextInputBindings
  smbUsernameInputBindings: TextInputBindings
  smbPasswordInputBindings: TextInputBindings
  smbDomainInputBindings: TextInputBindings
  smbCustomOptionsInputBindings: TextInputBindings
  s3EndpointInputBindings: TextInputBindings
  s3UseHttpsCheckboxBindings: CheckboxBindings
  s3AllowUnauthorizedCheckboxBindings: CheckboxBindings
  s3RegionInputBindings: TextInputBindings
  s3AccessKeyIdInputBindings: TextInputBindings
  s3SecretInputBindings: TextInputBindings
  s3BucketInputBindings: TextInputBindings
  s3PathInBucketInputBindings: TextInputBindings
}>()
</script>

<style lang="postcss" scoped>
.new-backup-repository-details-step {
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
