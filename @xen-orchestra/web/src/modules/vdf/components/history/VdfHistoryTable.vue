<template>
  <div ref="root" class="vdf-history-table">
    <!-- versions that changed nothing in this document (global syncs that only rewrote members…) -->
    <UiToggle v-if="unchangedCount > 0" v-model="showUnchanged" class="show-unchanged">
      {{ t('firewall:history:show-unchanged', { n: unchangedCount }, unchangedCount) }}
    </UiToggle>
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
import type { VdfHistoryChangeItem, VdfHistoryEntry } from '@/modules/vdf/types.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { computed, h, ref, useTemplateRef, watchEffect, withDirectives } from 'vue'
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

const { t, n, d } = useI18n()

const outsideText = useVdfOutsideText()

const showUnchanged = ref(false)

// changed nothing in the document: not the current version, no change
// made outside this XO, no global sync (it rewrote the global part), no
// change counted
const isUnchanged = (entry: VdfHistoryEntry) =>
  entry.id !== currentId &&
  entry.outside === undefined &&
  entry.sync === undefined &&
  entry.summary.added + entry.summary.modified + entry.summary.removed === 0

const unchangedCount = computed(() => entries.filter(isUnchanged).length)

const shownEntries = computed(() => (showUnchanged.value ? entries : entries.filter(entry => !isUnchanged(entry))))

const { pageRecords: pageEntries, paginationBindings } = usePagination(id, shownEntries)

const state = useTableState({ empty: () => shownEntries.value.length === 0 })

// one changed object in words: "db: 2 rules added, 1 removed", "group
// cache added"
function itemText(item: VdfHistoryChangeItem) {
  if (item.kind === 'settings') {
    return t('firewall:history:item:settings')
  }

  if (item.kind === 'group') {
    return t(`firewall:history:item:group:${item.change}`, { name: displayName(item.name) })
  }

  if (item.change !== 'modified') {
    return t(`firewall:history:item:policy:${item.change}`, { name: displayName(item.name) })
  }

  const parts = [
    item.rules.added > 0
      ? t('firewall:history:item:rules-added', { n: item.rules.added }, item.rules.added)
      : undefined,
    item.rules.removed > 0
      ? t('firewall:history:item:rules-removed', { n: item.rules.removed }, item.rules.removed)
      : undefined,
    item.rules.modified > 0
      ? t('firewall:history:item:rules-modified', { n: item.rules.modified }, item.rules.modified)
      : undefined,
    item.settings ? t('firewall:history:item:policy-settings') : undefined,
  ].filter(part => part !== undefined)

  return t('firewall:history:item:policy:modified', { name: displayName(item.name), changes: parts.join(', ') })
}

// what it changed, object by object (an older plugin: the counts)
function objectChanges(entry: VdfHistoryEntry) {
  const items = entry.changes?.items ?? []

  if (items.length === 0) {
    return undefined
  }

  const texts = items.map(itemText)

  return (entry.changes!.more > 0 ? [...texts, t('firewall:more', { n: entry.changes!.more })] : texts).join(' · ')
}

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
            : h('span', { class: 'date' }, [
                // the date and time, and how long ago
                h('span', d(new Date(entry.publishedAt), 'datetime_short')),
                h(VtsRelativeTime, { date: entry.publishedAt, class: 'secondary typo-body-regular-small' }),
              ]),
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
    changes: r => {
      const objects = entry.outside !== undefined && !entry.outside.docChanged ? undefined : objectChanges(entry)
      const text = objects ?? changesOf(entry)

      // long: cut, whole on hover
      return r(
        withDirectives(h('span', { class: 'changes' }, text), [[vTooltip, objects === undefined ? false : text]])
      )
    },
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

  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  :deep(.date) {
    display: inline-flex;
    flex-direction: column;
  }

  :deep(.changes) {
    display: inline-block;
    max-width: 48rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
