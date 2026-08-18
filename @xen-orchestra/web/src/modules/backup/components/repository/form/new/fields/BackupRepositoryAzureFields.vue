<template>
  <div class="backup-repository-azure-fields">
    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="hostNameInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="accountNameInputBindings" />
      <BackupRepositoryFormTextInput v-bind="keyInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="containerNameInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="pathInContainerInputBindings" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

type TextInputBindings = ModelBinding<string> & FieldMetadata & { label: string; required?: boolean }

defineProps<{
  hostNameInputBindings: TextInputBindings
  accountNameInputBindings: TextInputBindings
  keyInputBindings: TextInputBindings
  containerNameInputBindings: TextInputBindings
  pathInContainerInputBindings: TextInputBindings
}>()
</script>

<style lang="postcss" scoped>
.backup-repository-azure-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
