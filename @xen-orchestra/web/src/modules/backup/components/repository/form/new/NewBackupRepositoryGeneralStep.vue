<template>
  <div class="new-backup-repository-general-step">
    <BackupRepositoryFormTextInput v-bind="nameInputBindings" />
    <BackupRepositoryFormSelect v-bind="typeSelectBindings" />
    <BackupRepositoryFormSelect v-bind="backupFormatSelectBindings" />
    <BackupRepositoryFormSelect v-bind="proxySelectBindings" />
    <BackupRepositoryEncryptedCheckbox v-bind="encryptedCheckboxBindings" />
    <BackupRepositoryFormTextInput v-if="isEncrypted" v-bind="encryptionKeyInputBindings" />
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryEncryptedCheckbox from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryEncryptedCheckbox.vue'
import BackupRepositoryFormSelect from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormSelect.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import { useNewBackupRepositoryForm } from '@/modules/backup/form/new/use-new-backup-repository-form.ts'

const {
  nameInputBindings,
  typeSelectBindings,
  backupFormatSelectBindings,
  proxySelectBindings,
  encryptedCheckboxBindings,
  encryptionKeyInputBindings,
  isEncrypted,
} = useNewBackupRepositoryForm()
</script>

<style lang="postcss" scoped>
.new-backup-repository-general-step {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
