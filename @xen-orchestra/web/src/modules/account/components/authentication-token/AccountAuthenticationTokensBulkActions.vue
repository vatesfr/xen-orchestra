<template>
  <VtsTableBulkActions :actions="bulkActions" />
</template>

<script lang="ts" setup>
import { useAuthenticationTokenForget } from '@/modules/account/composables/use-authentication-token-forget.composable.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsTableBulkActions from '@core/components/table/VtsTableBulkActions.vue'
import type { XoAuthenticationToken } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { tokens } = defineProps<{
  tokens: XoAuthenticationToken[]
}>()

const { t } = useI18n()

const {
  forgetAuthenticationTokens,
  canForgetAuthenticationTokens,
  isForgettingAuthenticationTokens,
  forgetAuthenticationTokensErrorMessage,
} = useAuthenticationTokenForget(() => tokens)

const isSelectionEmpty = computed(() => tokens.length === 0)

const bulkActions = computed<ActionItem[]>(() => [
  {
    label: t('action:forget'),
    icon: 'action:forget',
    onClick: () => forgetAuthenticationTokens(),
    disabled: !canForgetAuthenticationTokens.value,
    busy: isForgettingAuthenticationTokens.value,
    hint: isSelectionEmpty.value ? t('no-token-selected') : forgetAuthenticationTokensErrorMessage.value,
    accent: 'danger',
  },
])
</script>
