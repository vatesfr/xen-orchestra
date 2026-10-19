<template>
  <div class="backup-repository-smb-fields">
    <UiAlert accent="info">
      {{ t('smb-intended-for-windows') }}
    </UiAlert>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.pathOnShare" />
      <FormTextInput v-bind="bindings.subfolder" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.username" />
      <FormTextInput v-bind="bindings.password" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <FormTextInput v-bind="bindings.domain" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextArea v-bind="bindings.customOptions" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup-repository/components/form/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextArea from '@/modules/backup-repository/components/form/inputs/BackupRepositoryFormTextArea.vue'
import type { SmbBackupRepositoryDetailsForm } from '@/modules/backup-repository/form/details/use-smb-backup-repository-details-form.ts'
import FormTextInput from '@/shared/components/form/FormTextInput.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: SmbBackupRepositoryDetailsForm['bindings']
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-repository-smb-fields {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
