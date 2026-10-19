<template>
  <UiPanelCard class="user-roles-card">
    <UiPanelCardTitle
      size="medium"
      :label="t('roles-applied')"
      :counter="areUserRolesReady ? userRoles.length : undefined"
    />

    <VtsStateHero v-if="hasUserRoleFetchError" type="error" format="card" horizontal size="extra-small">
      {{ t('error-no-data') }}
    </VtsStateHero>

    <VtsStateHero v-else-if="!areUserRolesReady" type="busy" format="card" horizontal size="extra-small" />

    <template v-else-if="sections.length > 0">
      <div v-for="section of sections" :key="section.key" class="section">
        <UiPanelCardTitle size="small" :label="section.label" />
        <UiLinkList variant="vertical" :visible-items="5" :total-items="section.roles.length">
          <UiLink
            v-for="role of section.roles"
            :key="role.id"
            icon="fa:key"
            size="small"
            :to="{ name: '/admin/user-management/roles', query: { id: role.id } }"
          >
            {{ role.name }}
          </UiLink>
        </UiLinkList>
      </div>
    </template>

    <VtsStateHero v-else type="no-data" format="card" horizontal size="extra-small">
      {{ t('no-role-applied') }}
    </VtsStateHero>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { type UserRole, useXoUserRoles } from '@/modules/user/composables/use-xo-user-roles.composable.ts'
import type { FrontXoUser } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type RoleSection = {
  key: string
  label: string
  roles: UserRole[]
}

const { user } = defineProps<{
  user: FrontXoUser
}>()

const { t } = useI18n()

const { userRoles, areUserRolesReady, hasUserRoleFetchError } = useXoUserRoles(() => user)

const { useGetGroupsByIds } = useXoGroupCollection()

const userGroups = useGetGroupsByIds(() => user.groups)

const sections = computed<RoleSection[]>(() => {
  const inheritedSections = userGroups.value
    .map(group => ({
      key: group.id,
      label: t('user:roles-from-group', { group: group.name }),
      roles: userRoles.value.filter(role =>
        role.inheritedFromGroups.some(inheritedGroup => inheritedGroup.id === group.id)
      ),
    }))
    .filter(section => section.roles.length > 0)

  const directRoles = userRoles.value.filter(role => role.isDirect)

  if (directRoles.length === 0) {
    return inheritedSections
  }

  return [...inheritedSections, { key: 'direct', label: t('user:direct-roles'), roles: directRoles }]
})
</script>

<style scoped lang="postcss">
.user-roles-card {
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
