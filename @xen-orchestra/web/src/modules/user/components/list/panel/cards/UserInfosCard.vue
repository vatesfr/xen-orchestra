<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <div class="title">
        <UiUserLogo size="small" />
        <UiLink :href="xo5UsersHref" size="medium">
          {{ user.name }}
        </UiLink>
      </div>
    </UiCardTitle>
    <div class="content">
      <VtsCodeSnippet :content="user.id" copy />
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('xoa-manager') }}</template>
        <template #value>{{ userPermission }}</template>
        <template #addons>
          <VtsCopyButton :value="userPermission" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('last-login') }}</template>
        <template #value>{{ lastLoginTimestamp }}</template>
        <template v-if="lastLoginTimestamp" #addons>
          <VtsCopyButton :value="lastLoginTimestamp" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('email') }}</template>
        <template #value>{{ user.email }}</template>
        <template #addons>
          <VtsCopyButton :value="user.email" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('providers') }}</template>
        <template #value>{{ providers }}</template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useXoUserAuthenticationTokensCollection } from '@/modules/user/remote-resources/use-xo-user-authentication-tokens-collection.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t, d } = useI18n()

const { buildXo5Route } = useXoRoutes()

const xo5UsersHref = computed(() => buildXo5Route('/settings/users'))

const { userAuthenticationTokens } = useXoUserAuthenticationTokensCollection({}, () => user.id)

const lastLoginTimestamp = computed(() => {
  let mostRecentTimestamp: number | undefined

  for (const token of userAuthenticationTokens.value ?? []) {
    for (const usage of Object.values(token.last_uses ?? {})) {
      if (mostRecentTimestamp === undefined || usage.timestamp > mostRecentTimestamp) {
        mostRecentTimestamp = usage.timestamp
      }
    }
  }

  if (mostRecentTimestamp === undefined) {
    return undefined
  }

  return d(mostRecentTimestamp, { dateStyle: 'short', timeStyle: 'medium' })
})

const providers = computed(() => {
  const providerList = Object.keys(user.authProviders ?? {})
  return providerList.length === 0 ? t('local') : providerList.join(', ')
})

const userPermission = computed(() => {
  if (user.permission === 'none') {
    return t('user')
  }
  return user.permission
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
