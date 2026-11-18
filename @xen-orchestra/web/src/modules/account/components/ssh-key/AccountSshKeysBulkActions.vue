<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useSshKeyDelete } from '@/modules/account/composables/use-ssh-key-delete.composable.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user, sshKeys } = defineProps<{
  user: XoUser
  sshKeys: SshKey[]
}>()

const { t } = useI18n()

const { deleteSshKeys, canDeleteSshKeys, isDeletingSshKeys, deleteSshKeysErrorMessage } = useSshKeyDelete(
  () => user,
  () => sshKeys
)

const isSelectionEmpty = computed(() => sshKeys.length === 0)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:delete'),
    icon: 'action:delete',
    onClick: () => deleteSshKeys(),
    disabled: !canDeleteSshKeys.value,
    busy: isDeletingSshKeys.value,
    hint: isSelectionEmpty.value ? t('no-ssh-key-selected') : deleteSshKeysErrorMessage.value,
    accent: 'danger',
  },
])
</script>
