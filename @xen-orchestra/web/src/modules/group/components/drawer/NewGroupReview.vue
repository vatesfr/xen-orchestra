<template>
  <div class="new-group-review">
    <UiTitle>
      {{ t('group-details') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'details')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <dl class="fields">
      <dt>{{ t('name') }}</dt>
      <dd>{{ name }}</dd>
    </dl>

    <UiTitle class="section-title">
      {{ t('group:roles-assignment') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'roles')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <UiLinkList v-if="roles.length > 0" variant="vertical" :visible-items="5" :total-items="roles.length">
      <UiLink
        v-for="role of roles"
        :key="role.id"
        icon="fa:key"
        size="small"
        :to="{ name: '/admin/user-management/roles', query: { id: role.id } }"
      >
        {{ role.name }}
      </UiLink>
    </UiLinkList>

    <span v-else>{{ t('no-role-applied') }}</span>

    <UiTitle class="section-title">
      {{ t('group:users-assignment') }}
      <template #action>
        <UiButton left-icon="fa:edit" variant="tertiary" accent="brand" size="medium" @click="emit('edit', 'users')">
          {{ t('action:edit') }}
        </UiButton>
      </template>
    </UiTitle>

    <UiLinkList v-if="users.length > 0" variant="vertical" :visible-items="5" :total-items="users.length">
      <UiLink
        v-for="user of users"
        :key="user.id"
        icon="fa:circle-user"
        size="small"
        :to="{ name: '/admin/user-management/users', query: { id: user.id } }"
      >
        {{ getUserDisplayName(user) }}
      </UiLink>
    </UiLinkList>

    <span v-else>{{ t('no-user-attached') }}</span>
  </div>
</template>

<script lang="ts" setup>
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import { type FrontXoUser, useXoUserCollection } from '@/modules/user/remote-resources/use-xo-user-collection.ts'
import { getUserDisplayName } from '@/modules/user/utils/xo-user.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiLinkList from '@core/components/ui/link-list/UiLinkList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { roleIds, userIds } = defineProps<{
  name: string
  roleIds: FrontXoRole['id'][]
  userIds: FrontXoUser['id'][]
}>()

const emit = defineEmits<{
  edit: [step: 'details' | 'roles' | 'users']
}>()

const { t } = useI18n()

const { useGetRolesByIds } = useXoRoleCollection()

const { useGetUsersByIds } = useXoUserCollection()

const roles = useGetRolesByIds(() => roleIds)

const users = useGetUsersByIds(() => userIds)
</script>

<style lang="postcss" scoped>
.new-group-review {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.6rem 6.4rem;

  & > * {
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
}
</style>
