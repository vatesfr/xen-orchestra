<template>
  <div class="roles">
    <UiAlert v-if="isInfoVisible" accent="info" close @close="hideInfo">
      <span class="typo-body-bold">{{ t('role:what-is-a-role?') }}</span>
      <template #description>
        <span class="typo-body-regular">{{ t('role:what-is-a-role-description') }}</span>
      </template>
    </UiAlert>
    <UiCard class="container">
      <RolesTable :roles :busy="!areRolesReady || !areGroupsReady" :error="hasRoleFetchError || hasGroupFetchError" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import { useXoGroupCollection } from '@/modules/group/remote-resources/use-xo-group-collection.ts'
import RolesTable from '@/modules/role/components/list/RolesTable.vue'
import { useXoRoleCollection } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useHidePermanently } from '@core/packages/hide-permanently/use-hide-permanently.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { roles, areRolesReady, hasRoleFetchError } = useXoRoleCollection()

// The users column counts the users inherited from the role's groups, so the table is only
// meaningful once the groups are loaded.
const { areGroupsReady, hasGroupFetchError } = useXoGroupCollection()

const [isInfoVisible, hideInfo] = useHidePermanently('what-is-a-role')
</script>

<style scoped lang="postcss">
.roles {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .container {
    height: fit-content;
    gap: 4rem;
  }
}
</style>
