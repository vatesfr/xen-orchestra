<template>
  <UiCard>
    <UiTitle>
      {{ t('user-details') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('username')" :value="user.username" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="user.id" />
      <VtsTabularKeyValueRow :label="t('last-login')" :value="lastLogin" />
      <VtsTabularKeyValueRow :label="t('first-name')" :value="user.firstname" />
      <VtsTabularKeyValueRow :label="t('last-name')" :value="user.lastname" />
      <VtsTabularKeyValueRow :label="t('email-address')" :value="user.email" />
      <VtsTabularKeyValueRow :label="t('providers')" :value="providers" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoUserUtils } from '@/modules/user/composables/use-xo-user-utils.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { lastLogin, providers } = useXoUserUtils(() => user)
</script>
