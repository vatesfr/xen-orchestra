<template>
  <div class="new-backup-repository-general-step">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <div class="row">
        <BackupRepositoryFormTextInput v-bind="nameInputBindings" />
      </div>

      <div class="row">
        <BackupRepositoryFormSelect v-bind="typeSelectBindings" />
        <BackupRepositoryFormSelect v-bind="backupFormatSelectBindings" />
      </div>

      <div class="row">
        <BackupRepositoryFormSelect v-bind="proxySelectBindings" />
      </div>
    </div>

    <div class="section">
      <UiTitle>{{ t('options') }}</UiTitle>

      <UiAlert accent="info">
        {{ t('encryption-available-for-block-modes-only') }}
      </UiAlert>

      <BackupRepositoryEncryptedCheckbox v-bind="encryptedCheckboxBindings" />

      <div v-if="encryptedCheckboxBindings.modelValue" class="row">
        <BackupRepositoryFormTextInput v-bind="encryptionKeyInputBindings" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryEncryptedCheckbox from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryEncryptedCheckbox.vue'
import BackupRepositoryFormSelect from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormSelect.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FormSelectId } from '@core/packages/form-select'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

type SelectBindings = { id: FormSelectId; label: string } & FieldMetadata

defineProps<{
  nameInputBindings: ModelBinding<string> & FieldMetadata & { label: string; required: boolean }
  typeSelectBindings: SelectBindings
  backupFormatSelectBindings: SelectBindings
  proxySelectBindings: SelectBindings
  encryptedCheckboxBindings: ModelBinding<boolean> & FieldMetadata
  encryptionKeyInputBindings: ModelBinding<string> & FieldMetadata & { label: string }
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.new-backup-repository-general-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      display: grid;
      grid-template-columns: repeat(2, 1fr);

      & > * {
        width: auto;
      }
    }
  }
}
</style>
