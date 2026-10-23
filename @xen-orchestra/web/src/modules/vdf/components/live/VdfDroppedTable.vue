<template>
  <VtsTable
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
import { useEndColumn } from '@/modules/vdf/components/live/vdf-end-column.ts'
import VdfDecisionCell from '@/modules/vdf/components/live/VdfDecisionCell.vue'
import VdfEndpoint from '@/modules/vdf/components/live/VdfEndpoint.vue'
import VdfService from '@/modules/vdf/components/live/VdfService.vue'
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
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
import { h, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

export type VdfDroppedRow = {
  key: string
  src: { ip: string; vm?: FrontXoVm; name?: string; groups: string[] }
  dst: { ip: string; vm?: FrontXoVm; name?: string }
  revoked: boolean
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

const { rows, scopeId } = defineProps<{
  scopeId: VdfScopeId
  rows: VdfDroppedRow[]
}>()

const { t } = useI18n()

const router = useRouter()

const { pageRecords: pageRows, paginationBindings } = usePagination('vdf-live-dropped', () => rows, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    rows.length === 0 ? { type: 'no-data', message: t('firewall:live:no-blocked'), size: 'extra-small' } : false,
})

const useDroppedColumns = defineColumns(() => ({
  source: useLiteralColumn({ headerLabel: () => t('firewall:source') }),
  destination: useLiteralColumn({ headerLabel: () => t('firewall:destination') }),
  service: useLiteralColumn({ headerLabel: () => t('firewall:service') }),
  decidedBy: useLiteralColumn({ headerLabel: () => t('firewall:log:decided-by') }),
  rate: useEndColumn({ headerLabel: () => t('firewall:live:dropped-rate') }),
  trace: useLiteralColumn({ headerLabel: () => t('firewall:live:why') }),
}))

const { HeadCells, BodyCells } = useDroppedColumns({
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
    decidedBy: r => r(h(VdfDecisionCell, { decision: row.decision, fallback: row.decisionText })),
    rate: r => r(withDirectives(h('span', { class: 'rate' }, row.rate), [[vTooltip, row.rateDetail ?? false]])),
    trace: r =>
      r(
        row.trace === undefined
          ? ''
          : withDirectives(
              h(UiButtonIcon, {
                icon: 'fa:route',
                size: 'small',
                accent: 'brand',
                'aria-label': row.traceLabel,
                onClick: () => router.push(row.trace!),
              }),
              [[vTooltip, row.traceLabel]]
            )
      ),
  }),
})
</script>

<style lang="postcss" scoped>
.vdf-dropped-table {
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
