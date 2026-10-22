<template>
  <div class="new-user-review">
    <UiTitle>
      {{ t('user:details') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'details')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <dl class="fields">
      <dt>{{ t('username') }}</dt>
      <dd>{{ details.username }}</dd>

      <dt>{{ t('first-name') }}</dt>
      <dd>{{ details.firstname }}</dd>

      <dt>{{ t('last-name') }}</dt>
      <dd>{{ details.lastname }}</dd>

      <dt>{{ t('email-address') }}</dt>
      <dd>{{ details.email }}</dd>
    </dl>

    <UiTitle class="section-title">
      {{ t('user:groups-assignment') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'groups')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <UiLinkList v-if="groups.length > 0" variant="vertical">
      <UiLink
        v-for="group of groups"
        :key="group.id"
        icon="table:group"
        size="small"
        :to="{ name: '/admin/user-management/groups', query: { id: group.id } }"
      >
        {{ group.name }}
      </UiLink>
    </UiLinkList>

    <span v-else>{{ t('no-group-attached') }}</span>

    <UiTitle class="section-title">
      {{ t('user:roles-assignment') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'roles')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <template v-if="roleSections.length > 0">
      <div v-for="section of roleSections" :key="section.key" class="role-section">
        <span class="typo-body-bold">{{ section.label }}</span>
        <UiLinkList variant="vertical">
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

    <span v-else>{{ t('no-role-applied') }}</span>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoGroup } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type RoleSection = {
  key: string
  label: string
  roles: FrontXoRole[]
}

const { groups, directRoleIds } = defineProps<{
  details: { username: string; firstname: string; lastname: string; email: string }
  groups: FrontXoGroup[]
  directRoleIds: FrontXoRole['id'][]
}>()

const emit = defineEmits<{
  edit: [step: 'details' | 'groups' | 'roles']
}>()

const { t } = useI18n()

const { getRolesByIds } = useXoRoleCollection()

const roleSections = computed<RoleSection[]>(() => {
  const inheritedSections = groups
    .map(group => ({
      key: group.id,
      label: t('user:roles-from-group', { group: group.name }),
      roles: getRolesByIds(group.aclRoleIds),
    }))
    .filter(section => section.roles.length > 0)

  const directRoles = getRolesByIds(directRoleIds)

  if (directRoles.length === 0) {
    return inheritedSections
  }

  return [...inheritedSections, { key: 'direct', label: t('user:direct-roles'), roles: directRoles }]
})
</script>

<style lang="postcss" scoped>
.new-user-review {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.6rem 6.4rem;

  > * {
    grid-column: 1 / -1;
  }

  .section-title {
    margin-block-start: 1.6rem;
  }

  .fields {
    display: grid;
    grid-template-columns: subgrid;
    row-gap: 0.8rem;
    margin: 0;
  }

  dt {
    color: var(--color-neutral-txt-secondary);
  }

  dd {
    margin: 0;
  }

  .role-section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
