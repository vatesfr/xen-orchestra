<template>
  <VtsTable
    ref="table"
    class="vdf-dropped-table"
    horizontal
    :state
    :pagination-bindings="rows.length > 10 ? paginationBindings : undefined"
  >
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="row of pageRows" :key="row.key">
        <BodyCells :item="row" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script lang="ts" setup>
import { useVdfActionsColumn } from '@/modules/vdf/components/live/vdf-actions-column.ts'
import { useEndColumn } from '@/modules/vdf/components/live/vdf-end-column.ts'
import VdfDecisionCell from '@/modules/vdf/components/live/VdfDecisionCell.vue'
import VdfEndpoint from '@/modules/vdf/components/live/VdfEndpoint.vue'
import VdfService from '@/modules/vdf/components/live/VdfService.vue'
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { h, useTemplateRef, watchEffect, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

export type VdfDroppedRow = {
  key: string
  src: { ip: string; vm?: FrontXoVm; name?: string; groups: string[]; iface?: string }
  dst: { ip: string; vm?: FrontXoVm; name?: string; groups?: string[]; iface?: string }
  revoked: boolean
  // dropped by the source's outbound rules or default (vdf#53)
  egress?: boolean
  proto?: string
  port?: string
  // a rule or a policy default; the agents' own attempts only know it's
  // the default (or a revoked connection)
  decision?: VdfDecision
  decisionText?: string
  rate: string
  // what the rate is made of, on hover
  rateDetail?: string
  trace?: RouteLocationRaw
  traceLabel: string
}

const { rows, scopeId, rateLabel } = defineProps<{
  scopeId: VdfScopeId
  rows: VdfDroppedRow[]
  // what the rate column holds: a rate (Live), or a count over a window
  rateLabel?: string
}>()

const { t } = useI18n()

const router = useRouter()

const { quarantineAction } = useVdfQuarantine()

const { pageRecords: pageRows, paginationBindings } = usePagination('vdf-live-dropped', () => rows, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    rows.length === 0 ? { type: 'no-data', message: t('firewall:live:no-blocked'), size: 'extra-small' } : false,
})

// a row's trace button
function traceButton(row: VdfDroppedRow) {
  return withDirectives(
    h(UiButtonIcon, {
      icon: 'fa:route',
      size: 'small',
      accent: 'brand',
      'aria-label': row.traceLabel,
      onClick: () => router.push(row.trace!),
    }),
    [[vTooltip, row.traceLabel]]
  )
}

// on a laptop (XO's tree open): the columns don't all fit
const isNarrow = useVdfNarrow(useTemplateRef('table'), 100)

const useDroppedColumns = defineColumns(() => ({
  source: useLiteralColumn({ headerLabel: () => t('firewall:source') }),
  destination: useLiteralColumn({ headerLabel: () => t('firewall:destination') }),
  service: useLiteralColumn({ headerLabel: () => t('firewall:service') }),
  decidedBy: useLiteralColumn({ headerLabel: () => t('firewall:log:decided-by') }),
  rate: useEndColumn({ headerLabel: () => rateLabel ?? t('firewall:live:dropped-rate') }),
  trace: useLiteralColumn({ headerLabel: () => t('firewall:live:why') }),
  actions: useVdfActionsColumn(),
}))

const { HeadCells, BodyCells, toggle } = useDroppedColumns({
  body: (row: VdfDroppedRow) => ({
    source: r => r(h(VdfEndpoint, { scopeId, ...row.src })),
    destination: r =>
      r(
        h('span', { class: 'cell' }, [
          h(VdfEndpoint, { scopeId, ...row.dst }),
          row.revoked ? h(UiTag, { accent: 'warning', variant: 'secondary' }, () => t('firewall:live:revoked')) : null,
        ])
      ),
    service: r => r(row.proto === undefined ? '' : h(VdfService, { proto: row.proto, port: row.port })),
    decidedBy: r => {
      const cell = h(VdfDecisionCell, { decision: row.decision, egress: row.egress, fallback: row.decisionText })

      // narrow: the trace button beside what decided, not in a column of its own
      return r(
        isNarrow.value && row.trace !== undefined ? h('span', { class: 'cell' }, [cell, traceButton(row)]) : cell
      )
    },
    rate: r => r(withDirectives(h('span', { class: 'rate' }, row.rate), [[vTooltip, row.rateDetail ?? false]])),
    trace: r => r(row.trace === undefined ? '' : traceButton(row)),
    // the source, when it's a VM of this pool
    actions: r => r(row.src.vm?.$pool === scopeId ? [quarantineAction(row.src.vm, { named: true })] : []),
  }),
})

watchEffect(() => toggle('trace', !isNarrow.value))

// a source VM of this pool to quarantine: no empty column otherwise
watchEffect(() =>
  toggle(
    'actions',
    rows.some(row => row.src.vm?.$pool === scopeId)
  )
)
</script>

<style lang="postcss" scoped>
.vdf-dropped-table {
  /* its endpoints narrow on a laptop */
  container: vdf-table / inline-size;

  :deep(.cell) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  :deep(.rate) {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}
</style>
