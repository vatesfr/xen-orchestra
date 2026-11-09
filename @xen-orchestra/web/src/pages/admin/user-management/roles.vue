<template>
  <VtsContentSidePanel class="roles">
    <div class="main">
      <RoleInfoAlert />
      <UiCard class="container">
        <RolesTable :roles :busy="!areRolesReady" :error="hasRoleFetchError">
          <template #title-action>
            <UiLink :to="{ name: '/admin/role/new' }" icon="fa:plus" size="medium">
              {{ t('new') }}
            </UiLink>
          </template>
        </RolesTable>
      </UiCard>
    </div>

    <RoleSidePanel :role="selectedRole" @close="selectedRole = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import RoleSidePanel from '@/modules/role/components/list/panel/RoleSidePanel.vue'
import RolesTable from '@/modules/role/components/list/RolesTable.vue'
import RoleInfoAlert from '@/modules/role/components/RoleInfoAlert.vue'
import { type FrontXoRole, useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { roles, getRoleById, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

const selectedRole = useRouteQuery<FrontXoRole | undefined>('id', {
  toData: id => getRoleById(id as FrontXoRole['id']),
  toQuery: role => role?.id ?? '',
})
</script>

<style scoped lang="postcss">
.roles {
  .main {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin: 0.8rem;
  }

  .container {
    height: fit-content;
    gap: 4rem;
  }
}
</style>
