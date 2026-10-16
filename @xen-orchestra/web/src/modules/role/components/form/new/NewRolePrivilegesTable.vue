<template>
  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="privilege of paginatedPrivileges" :key="privilege.key">
        <BodyCells :item="privilege" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import { usePrivilegeAppliedToCount } from '@/modules/role/composables/use-privilege-applied-to-count.composable.ts'
import { usePrivilegeScopeTypeLabels } from '@/modules/role/composables/use-privilege-scope-type-labels.composable.ts'
import type { StagedPrivilege } from '@/modules/role/types.ts'
import { getPrivilegeScopeType } from '@/modules/role/utils/privilege-scope.util.ts'
import { EFFECT_ACCENTS } from '@/modules/role/utils/xo-privilege.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { usePrivilegeColumns } from '@core/tables/column-sets/privilege-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { privileges } = defineProps<{
  privileges: StagedPrivilege[]
}>()

const emit = defineEmits<{
  edit: [privilege: StagedPrivilege]
  remove: [privilege: StagedPrivilege]
}>()

const { t } = useI18n()

const state = useTableState({
  empty: () => (privileges.length === 0 ? t('privilege:none-yet') : false),
})

const { pageRecords: paginatedPrivileges, paginationBindings } = usePagination('new-role-privileges', () => privileges)

const scopeTypeLabels = usePrivilegeScopeTypeLabels()

const { HeadCells, BodyCells } = usePrivilegeColumns({
  exclude: ['selectItem'],
  body: (privilege: StagedPrivilege) => {
    const scopeLabel = computed(() => scopeTypeLabels[getPrivilegeScopeType(privilege.selector)])

    const appliedToCount = usePrivilegeAppliedToCount(privilege)

    return {
      resource: r => r(privilege.resource),
      scope: r => r(scopeLabel.value),
      appliedTo: r => r(appliedToCount.value),
      action: r => r(privilege.action),
      effect: r => r(t(privilege.effect), EFFECT_ACCENTS[privilege.effect]),
      edit: r => r(() => emit('edit', privilege)),
      remove: r => r(() => emit('remove', privilege)),
    }
  },
})
</script>
