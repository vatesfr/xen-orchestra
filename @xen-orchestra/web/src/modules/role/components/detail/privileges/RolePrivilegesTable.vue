<template>
  <div class="role-privileges-table">
    <UiTitle>
      {{ t('privileges') }}
    </UiTitle>
    <VtsTable :state :pagination-bindings sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow
          v-for="privilege of paginatedPrivileges"
          :key="privilege.id"
          :selected="selectedPrivilegeId === privilege.id"
        >
          <BodyCells :item="privilege" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { usePrivilegeAppliedToCount } from '@/modules/role/composables/use-privilege-applied-to-count.composable.ts'
import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import type { FrontXoPrivilege } from '@/modules/role/remote-resources/use-xo-role-privileges-collection.ts'
import { getPrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import { EFFECT_ACCENTS } from '@/modules/role/utils/xo-privilege.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { usePrivilegeColumns } from '@core/tables/column-sets/privilege-columns.ts'
import { useI18n } from 'vue-i18n'

const { privileges, busy, error } = defineProps<{
  privileges: FrontXoPrivilege[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const selectedPrivilegeId = useRouteQuery('id')

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (privileges.length === 0 ? t('no-privilege-attached') : false),
})

const { pageRecords: paginatedPrivileges, paginationBindings } = usePagination('role-privileges', () => privileges)

const scopeTypeLabels = usePrivilegeScopeTypeLabels()

const { HeadCells, BodyCells } = usePrivilegeColumns({
  exclude: ['edit', 'remove'],
  body: (privilege: FrontXoPrivilege) => {
    const appliedToCount = usePrivilegeAppliedToCount(privilege)

    return {
      resource: r => r(privilege.resource),
      scope: r => r(scopeTypeLabels[getPrivilegeScopeType(privilege.selector)]),
      appliedTo: r => r(appliedToCount.value),
      action: r => r(privilege.action),
      effect: r => r(t(privilege.effect), EFFECT_ACCENTS[privilege.effect]),
      selectItem: r => r(() => (selectedPrivilegeId.value = privilege.id)),
    }
  },
})
</script>

<style lang="postcss" scoped>
.role-privileges-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
