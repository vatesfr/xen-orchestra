<template>
  <div class="backup-repository-smb-fields">
    <UiAlert accent="info">
      {{ t('smb-intended-for-windows') }}
    </UiAlert>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.pathOnShare" />
      <BackupRepositoryFormTextInput v-bind="bindings.subfolder" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.username" />
      <BackupRepositoryFormTextInput v-bind="bindings.password" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="bindings.domain" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextArea v-bind="bindings.customOptions" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormTextArea from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextArea.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/inputs/BackupRepositoryFormTextInput.vue'
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/BackupRepositoryFormRow.vue'
import type { SmbBackupRepositoryDetailsForm } from '@/modules/backup/form/details/use-smb-backup-repository-details-form.js'
import UiAlert from '@xen-orchestra/web-core/components/ui/alert/UiAlert.vue'
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
