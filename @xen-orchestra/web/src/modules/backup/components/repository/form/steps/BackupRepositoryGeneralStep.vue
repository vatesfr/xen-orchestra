<template>
  <div class="new-backup-repository-general-step">
    <div class="section">
      <UiTitle>{{ t('general-information') }}</UiTitle>

      <BackupRepositoryFormRow>
        <BackupRepositoryFormTextInput v-bind="bindings.name" />
      </BackupRepositoryFormRow>

      <BackupRepositoryFormRow>
        <BackupRepositoryFormSelect v-bind="bindings.type" />
        <BackupRepositoryFormSelect v-bind="bindings.backupFormat">
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
        <BackupRepositoryFormSelect v-bind="bindings.proxy" />
      </BackupRepositoryFormRow>
    </div>

    <div class="section">
      <UiTitle>{{ t('options') }}</UiTitle>

      <UiAlert accent="info">
        {{ t('encryption-available-for-block-modes-only') }}
      </UiAlert>

      <BackupRepositoryFormCheckbox v-bind="bindings.encrypted" />

      <BackupRepositoryFormRow v-if="bindings.encrypted.modelValue">
        <BackupRepositoryFormTextInput v-bind="bindings.encryptionKey" />
      </BackupRepositoryFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormCheckbox from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormCheckbox.vue'
import BackupRepositoryFormSelect from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormSelect.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextInput.vue'
import type { BackupRepositoryGeneralForm } from '@/modules/backup/form/use-backup-repository-general-form.js'
import VtsOption from '@xen-orchestra/web-core/components/select/VtsOption.vue'
import UiAlert from '@xen-orchestra/web-core/components/ui/alert/UiAlert.vue'
import UiTitle from '@xen-orchestra/web-core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupRepositoryGeneralForm['bindings']
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
  gap: 0.8rem;

  .hint {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
