<template>
  <div class="account-ssh-keys-table">
    <UiTitle>
      {{ t('ssh-keys') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <AccountSshKeysBulkActions :user :ssh-keys="selectedSshKeys" />

    <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="sshKey of paginatedSshKeys" :key="sshKey.key">
          <BodyCells :item="sshKey" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script setup lang="ts">
import AccountSshKeysBulkActions from '@/modules/account/components/ssh-key/AccountSshKeysBulkActions.vue'
import { useSshKeyDelete } from '@/modules/account/composables/use-ssh-key-delete.composable.ts'
import type { SshKey } from '@/modules/account/types/ssh-key.type.ts'
import { getXoUserSshKeys } from '@/modules/user/utils/xo-user.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useSshKeyColumns } from '@core/tables/column-sets/ssh-key-columns.ts'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

defineSlots<{
  'title-actions'?(): any
}>()

const { t } = useI18n()

const sshKeys = computed(() => getXoUserSshKeys(user))

const { pageRecords: paginatedSshKeys, paginationBindings } = usePagination('ssh-keys', sshKeys)

const {
  selectedItems: selectedSshKeys,
  pageSelectionModel,
  isSelected,
  toggleSelection,
  selectionBindings,
} = useTableSelection({
  items: sshKeys,
  filteredItems: sshKeys,
  pageItems: paginatedSshKeys,
  getItemId: sshKey => sshKey.key,
})

const state = useTableState({
  empty: () => sshKeys.value.length === 0 && t('no-ssh-key-detected'),
})

const { HeadCells, BodyCells } = useSshKeyColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (sshKey: SshKey) => {
    const { copy, isSupported } = useCopyToClipboard(() => sshKey.key)

    const { deleteSshKeys, canDeleteSshKeys, isDeletingSshKeys, deleteSshKeysErrorMessage } = useSshKeyDelete(
      () => user,
      () => [sshKey]
    )

    return {
      checkbox: r =>
        r({
          selected: isSelected(sshKey.key),
          onToggle: () => toggleSelection(sshKey.key),
        }),
      title: r => r(sshKey.title),
      key: r => r(sshKey.key),
      actions: r =>
        r([
          {
            label: t('action:copy-key'),
            icon: 'action:copy',
            onClick: () => copy(),
            disabled: !isSupported.value,
            hint: isSupported.value ? undefined : t('copy-unavailable-http'),
          },
          {
            label: t('action:delete'),
            icon: 'action:delete',
            onClick: () => deleteSshKeys(),
            disabled: !canDeleteSshKeys.value,
            busy: isDeletingSshKeys.value,
            hint: deleteSshKeysErrorMessage.value,
            accent: 'danger',
            separator: true,
          },
        ]),
    }
  },
})
</script>

<style scoped lang="postcss">
.account-ssh-keys-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
