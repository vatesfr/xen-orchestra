<template>
  <div ref="root" class="vdf-history-table">
    <!-- remeasured when a column drops: its sticky column's scroll shadow -->
    <VtsTable
      :key="String(isNarrow)"
      :state
      :pagination-bindings="entries.length > 10 ? paginationBindings : undefined"
      sticky="right"
    >
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="entry of pageEntries" :key="entry.id">
          <BodyCells :item="entry" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import { useVdfOutsideText } from '@/modules/vdf/composables/vdf-outside.composable.ts'
import type { VdfHistoryEntry } from '@/modules/vdf/types.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { computed, h, useTemplateRef, watchEffect, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'

// newest first
const { id, entries, currentId } = defineProps<{
  // pagination key
  id: string
  entries: VdfHistoryEntry[]
  currentId: number | undefined
}>()

const emit = defineEmits<{
  view: [entry: VdfHistoryEntry]
  restore: [entry: VdfHistoryEntry]
}>()

const { t, n } = useI18n()

const outsideText = useVdfOutsideText()

const { pageRecords: pageEntries, paginationBindings } = usePagination(
  id,
  computed(() => entries)
)

const state = useTableState({ empty: () => entries.length === 0 })

function changesOf({ summary, outside, sync }: VdfHistoryEntry) {
  // only the owner changed outside this XO
  if (outside !== undefined && !outside.docChanged) {
    return outside.owner === null
      ? t('firewall:outside:no-owner')
      : t('firewall:outside:owner-now', { xo: outside.owner.name })
  }

  const parts = [
    summary.added > 0 ? t('firewall:history:summary:added', { n: n(summary.added) }) : undefined,
    summary.modified > 0 ? t('firewall:history:summary:modified', { n: n(summary.modified) }) : undefined,
    summary.removed > 0 ? t('firewall:history:summary:removed', { n: n(summary.removed) }) : undefined,
  ].filter(part => part !== undefined)

  if (parts.length === 0 && sync !== undefined) {
    return t('firewall:history:sync:changes', { n: sync.revision ?? '?' })
  }

  return parts.length === 0 ? t('firewall:history:no-change') : parts.join(', ')
}

const contentOf = ({ summary }: VdfHistoryEntry) =>
  t('firewall:history:content', {
    policies: t('firewall:history:policies', { n: n(summary.policies) }, summary.policies),
    rules: t('firewall:history:rules', { n: n(summary.rules) }, summary.rules),
    groups: t('firewall:history:groups', { n: n(summary.groups) }, summary.groups),
  })

const useHistoryColumns = defineColumns(() => ({
  publishedAt: useLiteralColumn({ headerLabel: () => t('firewall:history:published') }),
  publishedBy: useLiteralColumn({ headerLabel: () => t('firewall:history:published-by') }),
  changes: useLiteralColumn({ headerLabel: () => t('firewall:history:changes') }),
  content: useLiteralColumn({ headerLabel: () => t('firewall:history:version') }),
  actions: useActionColumn({ buttonIcon: 'fa:eye' }),
}))

const { HeadCells, BodyCells, toggle } = useHistoryColumns({
  body: (entry: VdfHistoryEntry) => ({
    publishedAt: r =>
      r(
        h('span', { class: 'when' }, [
          entry.publishedAt === null
            ? h('span', { class: 'secondary' }, t('firewall:history:before-history'))
            : h(VtsRelativeTime, { date: entry.publishedAt }),
          entry.id === currentId
            ? h(UiTag, { accent: 'success', variant: 'secondary' }, () => t('firewall:history:current'))
            : null,
        ])
      ),
    // vdf#32: made outside this XO, publishedAt is when XO saw it
    publishedBy: r =>
      r(
        entry.sync !== undefined
          ? withDirectives(
              h(UiTag, { accent: 'info', variant: 'secondary', tabindex: 0 }, () => t('firewall:history:sync:by')),
              [[vTooltip, t('firewall:history:sync:info', { n: entry.sync.revision ?? '?' })]]
            )
          : entry.outside !== undefined
            ? withDirectives(
                h(
                  UiTag,
                  { accent: entry.outside.sameIdentity ? 'danger' : 'warning', variant: 'secondary', tabindex: 0 },
                  () => t('firewall:outside:by')
                ),
                [[vTooltip, outsideText.full(entry.outside)]]
              )
            : (entry.publishedBy ?? h('span', { class: 'secondary' }, t('firewall:history:unknown-user')))
      ),
    changes: r => r(changesOf(entry)),
    content: r =>
      r(
        entry.revision === undefined
          ? contentOf(entry)
          : t('firewall:history:revision-content', { n: entry.revision, content: contentOf(entry) })
      ),
    actions: r =>
      r({
        onClick: () => emit('view', entry),
        actions: [
          { label: t('firewall:history:view'), icon: 'fa:eye', onClick: () => emit('view', entry) },
          {
            label: t('firewall:history:restore'),
            icon: 'action:undo',
            disabled: entry.id === currentId,
            hint: entry.id === currentId ? t('firewall:history:restore:current') : undefined,
            onClick: () => emit('restore', entry),
          },
        ],
      }),
  }),
})

// on a laptop, a version's content is in its details (the eye)
const isNarrow = useVdfNarrow(useTemplateRef('root'), 112)

watchEffect(() => toggle('content', !isNarrow.value))
</script>

<style lang="postcss" scoped>
.vdf-history-table {
  :deep(.when) {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
