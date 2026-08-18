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
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryAzureFields from '@/modules/backup/components/repository/form/new/fields/BackupRepositoryAzureFields.vue'
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
}>()
</script>

<style lang="postcss" scoped>
.new-backup-repository-details-step {
  margin-block-start: 2.4rem;
  text-align: left;
}
</style>
