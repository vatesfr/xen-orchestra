<template>
  <div class="role-templates-table">
    <UiTitle>{{ t('role-templates') }}</UiTitle>
    <VtsTable :state sticky="right">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow
          v-for="roleTemplate of roleTemplates"
          :key="roleTemplate.id"
          :selected="selectedRoleTemplateId === roleTemplate.id"
        >
          <BodyCells :item="roleTemplate" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoRoleTemplate } from '@/modules/role/remote-resources/use-xo-role-template-collection.ts'
import { getNewRoleFromTemplateRoute } from '@/modules/role/utils/role-template.util.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useRoleTemplateColumns } from '@core/tables/column-sets/role-template-columns.ts'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { roleTemplates, busy, error } = defineProps<{
  roleTemplates: FrontXoRoleTemplate[]
  busy?: boolean
  error?: boolean
}>()

const { t } = useI18n()

const router = useRouter()

const selectedRoleTemplateId = useRouteQuery('id')

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (roleTemplates.length === 0 ? t('no-role-template-detected') : false),
})

const { HeadCells, BodyCells } = useRoleTemplateColumns({
  body: (roleTemplate: FrontXoRoleTemplate) => ({
    name: r => r(roleTemplate.name, { leftIcon: { icon: 'fa:key' } }),
    description: r => r(roleTemplate.description ?? ''),
    privileges: r => r(roleTemplate.privilegeIds.length),
    select: r => r(t('action:select-template'), () => router.push(getNewRoleFromTemplateRoute(roleTemplate.id))),
    selectItem: r => r(() => (selectedRoleTemplateId.value = roleTemplate.id)),
  }),
})
</script>

<style scoped lang="postcss">
.role-templates-table {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
