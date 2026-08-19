<template>
  <div class="backup-repository-smb-fields">
    <UiAlert accent="info">
      {{ t('smb-intended-for-windows') }}
    </UiAlert>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="pathOnShareInputBindings" />
      <BackupRepositoryFormTextInput v-bind="subfolderInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="usernameInputBindings" />
      <BackupRepositoryFormTextInput v-bind="passwordInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow>
      <BackupRepositoryFormTextInput v-bind="domainInputBindings" />
    </BackupRepositoryFormRow>

    <BackupRepositoryFormRow wide>
      <BackupRepositoryFormTextInput v-bind="customOptionsInputBindings" />
    </BackupRepositoryFormRow>
  </div>
</template>

<script lang="ts" setup>
import BackupRepositoryFormRow from '@/modules/backup/components/repository/form/new/BackupRepositoryFormRow.vue'
import BackupRepositoryFormTextInput from '@/modules/backup/components/repository/form/new/inputs/BackupRepositoryFormTextInput.vue'
import type { FieldMetadata, ModelBinding } from '@core/packages/validated-form'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { useI18n } from 'vue-i18n'

type TextInputBindings = ModelBinding<string> &
  FieldMetadata & { label: string; required?: boolean; placeholder?: string; info?: string; prefix?: string }

defineProps<{
  pathOnShareInputBindings: TextInputBindings
  subfolderInputBindings: TextInputBindings
  usernameInputBindings: TextInputBindings
  passwordInputBindings: TextInputBindings
  domainInputBindings: TextInputBindings
  customOptionsInputBindings: TextInputBindings
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
