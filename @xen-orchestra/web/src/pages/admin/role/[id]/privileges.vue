<template>
  <RoleDetailLayout :role>
    <UiCard>
      <RolePrivilegesTable :privileges :busy="!arePrivilegesReady" :error="hasPrivilegeFetchError" />
    </UiCard>
    <template #panel>
      <PrivilegeSidePanel
        :privilege="selectedPrivilege"
        :number="selectedPrivilegeNumber"
        @close="selectedPrivilege = undefined"
      />
    </template>
  </RoleDetailLayout>
</template>

<script lang="ts" setup>
import RolePrivilegesTable from '@/modules/role/components/detail/privileges/RolePrivilegesTable.vue'
import RoleDetailLayout from '@/modules/role/components/detail/RoleDetailLayout.vue'
import PrivilegeSidePanel from '@/modules/role/components/privilege/panel/PrivilegeSidePanel.vue'
import type { FrontXoRole } from '@/modules/role/remote-resources/use-xo-role-collection.ts'
import {
  type FrontXoPrivilege,
  useXoRolePrivilegesCollection,
} from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { computed } from 'vue'

const { role } = defineProps<{
  role: FrontXoRole
}>()

const { privileges, getPrivilegeById, arePrivilegesReady, hasPrivilegeFetchError } = useXoRolePrivilegesCollection(
  {},
  () => role.id
)

const selectedPrivilege = useRouteQuery<FrontXoPrivilege | undefined>('id', {
  toData: id => getPrivilegeById(id as FrontXoPrivilege['id']),
  toQuery: privilege => privilege?.id ?? '',
})

const selectedPrivilegeNumber = computed(
  () => privileges.value.findIndex(privilege => privilege.id === selectedPrivilege.value?.id) + 1
)
</script>
