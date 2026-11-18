<template>
  <VtsActionButton
    :hint="editAccountErrorMessage"
    variant="secondary"
    accent="brand"
    icon="action:edit"
    :disabled="!canEditAccount"
    :busy="isEditingAccount"
    @click="editAccount()"
  >
    {{ t('action:edit') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useEditAccount } from '@/modules/account/composables/use-edit-account.composable.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import type { XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const { t } = useI18n()

const { editAccount, canEditAccount, isEditingAccount, editAccountErrorMessage } = useEditAccount(() => user)
</script>
