<template>
  <UiCard>
    <UiTitle>
      {{ t('password') }}
      <template v-if="!isSynchronized" #action>
        <AccountEditPasswordButton />
      </template>
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('password')" value="••••••••••••" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import AccountEditPasswordButton from '@/modules/account/components/actions/edit-password/AccountEditPasswordButton.vue'
import { isXoUserSynchronized } from '@/modules/user/utils/xo-user.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoUser } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: XoUser
}>()

const { t } = useI18n()

const isSynchronized = computed(() => isXoUserSynchronized(user))
</script>
