<template>
  <UiPanelCard class="role-users-card">
    <UiPanelCardTitle size="medium" :label="t('users')" :counter="isReady ? totalUserCount : undefined" />

    <VtsStateHero v-if="hasFetchError" type="error" format="card" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>

    <VtsStateHero v-else-if="!isReady" type="busy" format="card" horizontal size="extra-small" />

    <template v-else-if="sections.length > 0">
      <div v-for="section of sections" :key="section.key" class="section">
        <UiPanelCardTitle size="small" :label="section.label" />
        <UiLinkList variant="vertical" :visible-items="5" :total-items="section.users.length">
          <UiLink
            v-for="user of section.users"
            :key="user.id"
            icon="fa:circle-user"
            size="small"
            :to="{ name: '/admin/user-management/users', query: { id: user.id } }"
          >
            {{ user.name ?? user.email }}
          </UiLink>
        </UiLinkList>
      </div>
    </template>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-user-attached') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { getRoleUserIds } from '@/modules/role/utils/xo-role.util.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type UserSection = {
  key: string
  label: string
  users: FrontXoUser[]
}

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { t } = useI18n()

const { getUsersByIds, useGetUsersByIds, areUsersReady, hasUserFetchError } = useXoUserCollection()
const { useGetGroupsByIds, areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const isReady = computed(() => areUsersReady.value && areGroupsReady.value)

const hasFetchError = computed(() => hasUserFetchError.value || hasGroupFetchError.value)

const directUsers = useGetUsersByIds(() => role.userIds)

const roleGroups = useGetGroupsByIds(() => role.groupIds)

const sections = computed<UserSection[]>(() => {
  const inheritedSections = roleGroups.value
    .map(group => ({
      key: group.id,
      label: t('role:users-from-group', { group: group.name }),
      users: getUsersByIds(group.users),
    }))
    .filter(section => section.users.length > 0)

  if (directUsers.value.length === 0) {
    return inheritedSections
  }

  return [...inheritedSections, { key: 'direct', label: t('role:direct-users'), users: directUsers.value }]
})

const totalUserCount = computed(() => getRoleUserIds(role, roleGroups.value).length)
</script>

<style scoped lang="postcss">
.role-users-card {
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
