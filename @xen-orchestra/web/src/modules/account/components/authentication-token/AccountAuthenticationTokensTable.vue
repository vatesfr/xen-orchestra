<template>
  <div class="account-authentication-tokens-table">
    <UiTitle>
      {{ t('authentication-tokens') }}
      <template #action>
        <slot name="title-actions" />
      </template>
    </UiTitle>
    <AccountAuthenticationTokensBulkActions :tokens="selectedTokens" />

    <VtsTable :state :pagination-bindings :selection-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="token of paginatedTokens" :key="token.id">
          <BodyCells :item="token" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script setup lang="ts">
import AccountAuthenticationTokensBulkActions from '@/modules/account/components/authentication-token/AccountAuthenticationTokensBulkActions.vue'
import { useAuthenticationTokenForget } from '@/modules/account/composables/use-authentication-token-forget.composable.ts'
import { useCurrentAuthenticationTokenId } from '@/modules/account/composables/use-current-authentication-token-id.composable.ts'
import { useEditAuthenticationToken } from '@/modules/account/composables/use-edit-authentication-token.composable.ts'
import {
  getXoAuthenticationTokenLabel,
  getXoAuthenticationTokenLastUse,
} from '@/modules/account/utils/xo-authentication-token.util.ts'
import { useXoUserAuthenticationTokensCollection } from '@/modules/user/remote-resources/use-xo-user-authentication-tokens-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useCopyToClipboard } from '@core/composables/copy.composable.ts'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableSelection } from '@core/composables/table-selection.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useAuthenticationTokenColumns } from '@core/tables/column-sets/authentication-token-columns.ts'
import type { XoAuthenticationToken, XoUser } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

defineSlots<{
  'title-actions'?(): any
}>()

const { t } = useI18n()

const { userAuthenticationTokens, areUserAuthenticationTokensReady, areUserAuthenticationTokensFetchError } =
  useXoUserAuthenticationTokensCollection({}, () => user.id)

const currentTokenId = useCurrentAuthenticationTokenId()

const { pageRecords: paginatedTokens, paginationBindings } = usePagination(
  'authentication-tokens',
  userAuthenticationTokens
)

const {
  selectedItems: selectedTokens,
  pageSelectionModel,
  isSelected,
  toggleSelection,
  selectionBindings,
} = useTableSelection({
  items: userAuthenticationTokens,
  filteredItems: userAuthenticationTokens,
  pageItems: paginatedTokens,
  getItemId: token => token.id,
})

const state = useTableState({
  busy: () => !areUserAuthenticationTokensReady.value,
  error: () => areUserAuthenticationTokensFetchError.value,
  empty: () => userAuthenticationTokens.value.length === 0 && t('no-authentication-token-detected'),
})

const { HeadCells, BodyCells } = useAuthenticationTokenColumns({
  head: () => ({
    checkbox: r => r(pageSelectionModel),
  }),
  body: (token: XoAuthenticationToken) => {
    const lastUse = getXoAuthenticationTokenLastUse(token)

    const { copy, isSupported } = useCopyToClipboard(() => token.id)

    const {
      editAuthenticationToken,
      canEditAuthenticationToken,
      isEditingAuthenticationToken,
      editAuthenticationTokenErrorMessage,
    } = useEditAuthenticationToken(() => token)

    const {
      forgetAuthenticationTokens,
      canForgetAuthenticationTokens,
      isForgettingAuthenticationTokens,
      forgetAuthenticationTokensErrorMessage,
    } = useAuthenticationTokenForget(() => [token])

    return {
      checkbox: r =>
        r({
          selected: isSelected(token.id),
          onToggle: () => toggleSelection(token.id),
        }),
      token: r => r(getXoAuthenticationTokenLabel(token)),
      description: r =>
        r(
          token.id === currentTokenId.value
            ? t('description-current-session', { description: token.description ?? '' }).trim()
            : (token.description ?? '')
        ),
      lastUse: r => r(lastUse?.timestamp, { relative: true }),
      ipAddress: r => r(lastUse?.ip ?? ''),
      expiration: r => r(token.expiration),
      actions: r =>
        r([
          {
            label: t('action:copy-token'),
            icon: 'action:copy',
            onClick: () => copy(),
            disabled: !isSupported.value,
            hint: isSupported.value ? undefined : t('copy-unavailable-http'),
          },
          {
            label: t('action:edit-description'),
            icon: 'action:edit',
            onClick: () => editAuthenticationToken(),
            disabled: !canEditAuthenticationToken.value,
            busy: isEditingAuthenticationToken.value,
            hint: editAuthenticationTokenErrorMessage.value,
          },
          {
            label: t('action:forget'),
            icon: 'action:forget',
            onClick: () => forgetAuthenticationTokens(),
            disabled: !canForgetAuthenticationTokens.value,
            busy: isForgettingAuthenticationTokens.value,
            hint: forgetAuthenticationTokensErrorMessage.value,
            accent: 'danger',
            separator: true,
          },
        ]),
    }
  },
})
</script>

<style scoped lang="postcss">
.account-authentication-tokens-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
