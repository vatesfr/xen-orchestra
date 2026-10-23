<template>
  <div ref="root" class="vdf-groups-table">
    <UiQuerySearchBar v-if="isLong" @search="value => (search = value)" />
    <!-- remeasured when columns drop: its sticky column's scroll shadow -->
    <VtsTable
      :key="`${isNarrow}-${isVeryNarrow}-${isPoolsNarrow}`"
      :state
      :pagination-bindings="isLong ? paginationBindings : undefined"
      sticky="right"
    >
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row of pageRows" :key="row.name" :selected="selected === row.name" :data-group="row.name">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useCollapsedListColumn } from '@core/tables/column-definitions/collapsed-list-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { computed, h, nextTick, ref, useTemplateRef, watch, watchEffect, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'

export type VdfGroupRow = {
  name: string
  label: string
  isGlobal: boolean
  tags: string[]
  ips: string[]
  members: FrontXoVm[]
  // global configuration: the pools of the members
  pools: string[]
  // policies protecting the group, or admitting traffic from it
  usedBy: string[]
  draftState: 'new' | 'modified' | undefined
  actions: ActionItem[]
}

const {
  id,
  rows,
  selected,
  emptyMessage,
  withPools = false,
} = defineProps<{
  // pagination key
  id: string
  rows: VdfGroupRow[]
  selected: string | undefined
  emptyMessage: string
  withPools?: boolean
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

const { t } = useI18n()

// a few groups read at a glance: search and pages only for long lists
const isLong = computed(() => rows.length > 10)

const search = ref('')

const filteredRows = computed(() => {
  const term = search.value.trim().toLocaleLowerCase()

  if (term === '') {
    return rows
  }

  return rows.filter(row =>
    [row.label, ...row.tags, ...row.ips, ...row.members.map(vm => vm.name_label), ...row.usedBy, ...row.pools].some(
      value => value.toLocaleLowerCase().includes(term)
    )
  )
})

const { pageRecords: pageRows, paginationBindings, seek } = usePagination(id, filteredRows)

const state = useTableState({
  empty: () => (rows.length === 0 ? emptyMessage : filteredRows.value.length === 0 ? { type: 'no-result' } : false),
})

// a deep link (`?group=`) lands on the group's page, with its row in view
const root = useTemplateRef('root')

watch(
  () => selected,
  async name => {
    if (name === undefined || !filteredRows.value.some(row => row.name === name)) {
      return
    }

    seek(row => row.name === name)
    await nextTick()

    root.value
      ?.querySelector(`[data-group="${CSS.escape(name)}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  },
  { immediate: true }
)

const useGroupColumns = defineColumns(() => ({
  group: useLiteralColumn({ headerLabel: () => t('firewall:group') }),
  tags: useTagColumn({ headerLabel: () => t('firewall:group-form:tags') }),
  members: useCollapsedListColumn({ headerLabel: () => t('firewall:members') }),
  pools: useCollapsedListColumn({ headerLabel: () => t('firewall:global:pools') }),
  usedBy: useLiteralColumn({ headerLabel: () => t('firewall:used-by') }),
  actions: useActionColumn({}),
}))

const { HeadCells, BodyCells, toggle } = useGroupColumns({
  body: (row: VdfGroupRow) => ({
    group: r =>
      r(
        h('span', { class: 'name' }, [
          h(VtsIcon, { name: row.isGlobal ? 'fa:globe' : 'fa:object-group', size: 'medium' }),
          h('span', { class: 'typo-body-bold' }, row.label),
          row.draftState === undefined
            ? null
            : h(UiTag, { accent: row.draftState === 'new' ? 'success' : 'info', variant: 'secondary' }, () =>
                t(`firewall:draft-state:${row.draftState}`)
              ),
        ])
      ),
    tags: r => r(row.tags),
    members: r =>
      r(row.members.length + row.ips.length === 0 ? t('none') : [...row.members.map(vm => vm.name_label), ...row.ips]),
    pools: r => r(row.pools.length === 0 ? t('none') : row.pools),
    usedBy: r =>
      r(
        row.usedBy.length === 0
          ? h('span', { class: 'secondary' }, t('firewall:used-by:none'))
          : // the policies' names on hover, and for screen readers
            withDirectives(
              h(
                'span',
                { 'aria-label': t('firewall:used-by:policies', { policies: row.usedBy.join(', ') }) },
                t('firewall:n-policies', { n: row.usedBy.length })
              ),
              [[vTooltip, row.usedBy.join('\n')]]
            )
      ),
    actions: r => r({ onClick: () => emit('select', row.name), actions: row.actions }),
  }),
})

// beside the side panel, on a laptop: the panel shows what the table drops
const isNarrow = useVdfNarrow(root, 64)

const isVeryNarrow = useVdfNarrow(root, 57)

const isPoolsNarrow = useVdfNarrow(root, 76)

watchEffect(() => {
  toggle('usedBy', !isNarrow.value)
  toggle('tags', !isVeryNarrow.value)

  // the members' pools: in the global configuration only
  toggle('pools', withPools && !isPoolsNarrow.value)
})
</script>

<style lang="postcss" scoped>
.vdf-groups-table {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  :deep(.name) {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }

  /* beside the side panel: the field shrinks before the Search button is cut */
  :deep(.ui-query-search-bar) {
    .ui-input,
    input {
      min-width: 0;
    }
  }
}
</style>
