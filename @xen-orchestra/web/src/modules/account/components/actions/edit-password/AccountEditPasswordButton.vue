<template>
  <VtsActionButton
    :hint="editAccountPasswordErrorMessage"
    variant="secondary"
    accent="brand"
    icon="action:edit"
    :disabled="!canEditAccountPassword"
    :busy="isEditingAccountPassword"
    @click="editAccountPassword()"
  >
    {{ t('action:edit') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useEditAccountPassword } from '@/modules/account/composables/use-edit-account-password.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { editAccountPassword, canEditAccountPassword, isEditingAccountPassword, editAccountPasswordErrorMessage } =
  useEditAccountPassword()
</script>
