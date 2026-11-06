<template>
  <UiPanelCard class="user-infos-card">
    <UiPanelCardTitle :id="user.id" size="medium">
      <template #label>
        <span class="name">
          <UiUserLogo size="small" />
          <UiLink :to="{ name: '/admin/user/[id]/general', params: { id: user.id } }" size="medium">
            {{ getUserDisplayName(user) }}
          </UiLink>
        </span>
      </template>
    </UiPanelCardTitle>
    <div class="content">
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('xoa-manager') }}</template>
        <template #value>{{ userPermission }}</template>
        <template #addons>
          <VtsCopyButton :value="userPermission" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('last-login') }}</template>
        <template #value>{{ lastLogin }}</template>
        <template v-if="lastLogin" #addons>
          <VtsCopyButton :value="lastLogin" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('first-name') }}</template>
        <template #value>{{ user.firstname }}</template>
        <template v-if="user.firstname" #addons>
          <VtsCopyButton :value="user.firstname" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue truncate align-top>
        <template #key>{{ t('last-name') }}</template>
        <template #value>{{ user.lastname }}</template>
        <template v-if="user.lastname" #addons>
          <VtsCopyButton :value="user.lastname" />
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
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoUserUtils } from '@/modules/user/composables/use-xo-user-utils.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserDisplayName } from '@/modules/user/utils/xo-user.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiUserLogo from '@core/components/ui/user-logo/UiUserLogo.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { lastLogin, providers } = useXoUserUtils(() => user)

const userPermission = computed(() => {
  if (user.permission === 'none') {
    return t('user')
  }
  return user.permission
})
</script>

<style scoped lang="postcss">
.user-infos-card {
  .name {
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
