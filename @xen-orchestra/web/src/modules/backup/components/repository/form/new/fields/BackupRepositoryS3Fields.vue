<template>
  <div class="backup-repository-s3-fields">
    <div class="endpoint-row">
      <BackupRepositoryFormTextInput v-bind="endpointInputBindings" class="endpoint" />
      <div class="checkboxes">
        <BackupRepositoryFormCheckbox v-bind="useHttpsCheckboxBindings" />
        <BackupRepositoryFormCheckbox
          v-if="useHttpsCheckboxBindings.modelValue"
          v-bind="allowUnauthorizedCheckboxBindings"
        />
      </div>
    </div>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="regionInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="accessKeyIdInputBindings" />
      <BackupRepositoryFormTextInput v-bind="secretInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bucketInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="pathInBucketInputBindings" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'

type TextInputBindings = ModelBinding<string> & FieldMetadata & { label: string; required?: boolean; info?: string }

type CheckboxBindings = ModelBinding<boolean> & FieldMetadata & { label: string }

defineProps<{
  endpointInputBindings: TextInputBindings
  useHttpsCheckboxBindings: CheckboxBindings
  allowUnauthorizedCheckboxBindings: CheckboxBindings
  regionInputBindings: TextInputBindings
  accessKeyIdInputBindings: TextInputBindings
  secretInputBindings: TextInputBindings
  bucketInputBindings: TextInputBindings
  pathInBucketInputBindings: TextInputBindings
}>()
</script>

<style lang="postcss" scoped>
.backup-repository-s3-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .endpoint-row {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: 2fr 1fr;
      align-items: start;
    }

    .endpoint {
      min-width: 0;
    }

    .checkboxes {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;

      @media (--medium-or-large) {
        margin-block-start: 0.4rem;
      }
    }
  }
}
</style>
