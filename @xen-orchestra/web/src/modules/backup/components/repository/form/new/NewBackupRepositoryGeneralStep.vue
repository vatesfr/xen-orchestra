<template>
  <div class="new-backup-repository-general-step">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <BackupRepositoryFormRow>
        <BackupRepositoryFormTextInput v-bind="nameInputBindings" />
      </BackupRepositoryFormRow>

      <BackupRepositoryFormRow>
        <BackupRepositoryFormSelect v-bind="typeSelectBindings" />
        <BackupRepositoryFormSelect v-bind="backupFormatSelectBindings">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="option-content">
                <span class="typo-body-bold">{{ option.properties.label }}</span>
                <span v-if="option.properties.hint" class="em-dash-prefix hint typo-body-regular">
                  {{ option.properties.hint }}
                </span>
              </span>
            </VtsOption>
          </template>
        </BackupRepositoryFormSelect>
      </BackupRepositoryFormRow>

      <BackupRepositoryFormRow>
        <BackupRepositoryFormSelect v-bind="proxySelectBindings" />
      </BackupRepositoryFormRow>
    </div>

    <div class="section">
      <UiTitle>{{ t('options') }}</UiTitle>

      <UiAlert accent="info">
        {{ t('encryption-available-for-block-modes-only') }}
      </UiAlert>

      <BackupRepositoryFormCheckbox v-bind="encryptedCheckboxBindings" />

      <BackupRepositoryFormRow v-if="encryptedCheckboxBindings.modelValue">
        <BackupRepositoryFormTextInput v-bind="encryptionKeyInputBindings" />
      </BackupRepositoryFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormSelect from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormSelect.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FormSelectId } from '@core/packages/form-select'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

type SelectBindings = { id: FormSelectId; label: string; learnMoreUrl?: string } & FieldMetadata

defineProps<{
  nameInputBindings: ModelBinding<string> & FieldMetadata & { label: string; required: boolean }
  typeSelectBindings: SelectBindings
  backupFormatSelectBindings: SelectBindings
  proxySelectBindings: SelectBindings
  encryptedCheckboxBindings: ModelBinding<boolean> & FieldMetadata
  encryptionKeyInputBindings: ModelBinding<string> & FieldMetadata & { label: string; required: boolean; info: string }
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
}

.option-content {
  display: inline-flex;
  align-items: baseline;
  gap: 0.8rem;

  .hint {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
