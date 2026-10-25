<template>
  <div class="vdf-connections-table">
    <div class="toolbar">
      <UiToggle v-model="isGrouped">{{ t('firewall:live:group-connections') }}</UiToggle>
      <UiQuerySearchBar class="search" @search="value => (search = value)" />
    </div>
    <VtsTable :state :pagination-bindings horizontal>
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
  </div>
</template>

<script lang="ts" setup>
import { useVdfActionsColumn } from '@/modules/vdf/components/live/vdf-actions-column.ts'
import VdfDecisionCell from '@/modules/vdf/components/live/VdfDecisionCell.vue'
import VdfEndpoint from '@/modules/vdf/components/live/VdfEndpoint.vue'
import VdfService from '@/modules/vdf/components/live/VdfService.vue'
import type { VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import type { VdfScopeId } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { computed, h, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

type Endpoint = { ip: string; vm?: FrontXoVm; name?: string; groups?: string[]; iface?: string }

export type VdfConnectionItem = {
  key: string
  src: Endpoint
  dst: Endpoint
  proto: string
  port: string
  // connection tracking's own state (TIME_WAIT, ESTABLISHED…)
  state: string
  revoked: boolean
  // revoked by its source's outbound rules (vdf#53)
  revokedByEgress?: boolean
  // the rule that let it in; none for connections older than the policy
  decision?: VdfDecision
  // the source's outbound rule that let it out (vdf#53)
  egressDecision?: VdfDecision
}

const { connections, scopeId } = defineProps<{
  scopeId: VdfScopeId
  connections: VdfConnectionItem[]
}>()

const { t, n } = useI18n()

const { quarantineAction } = useVdfQuarantine()

// identical connections (same ends, service and rule) on one row, by default
const isGrouped = ref(true)

const search = ref('')

// connection tracking states, in plain words
const STATE_KINDS: Record<string, 'open' | 'opening' | 'closing' | 'closed'> = {
  ESTABLISHED: 'open',
  ASSURED: 'open',
  SYN_SENT: 'opening',
  SYN_RECV: 'opening',
  UNREPLIED: 'opening',
  FIN_WAIT: 'closing',
  CLOSE_WAIT: 'closing',
  LAST_ACK: 'closing',
  TIME_WAIT: 'closing',
  CLOSING: 'closing',
  CLOSE: 'closed',
}

function stateLabel(state: string) {
  const kind = STATE_KINDS[state.toUpperCase()]

  return kind === undefined ? state || t('firewall:live:state:unknown') : t(`firewall:live:state:${kind}`)
}

type Row = Omit<VdfConnectionItem, 'state'> & { count: number; states: Map<string, number> }

const rows = computed<Row[]>(() => {
  const term = search.value.trim().toLocaleLowerCase()
  const groups = new Map<string, Row>()

  for (const connection of connections) {
    const label = stateLabel(connection.state)

    if (
      term !== '' &&
      ![
        connection.src.ip,
        connection.src.vm?.name_label,
        connection.src.name,
        ...(connection.src.groups ?? []),
        connection.dst.ip,
        connection.dst.vm?.name_label,
        connection.dst.name,
        connection.proto,
        connection.port,
        label,
        connection.decision?.label,
        connection.egressDecision?.label,
      ].some(value => value?.toLocaleLowerCase().includes(term))
    ) {
      continue
    }

    const key = isGrouped.value
      ? [
          connection.src.ip,
          connection.dst.ip,
          connection.proto,
          connection.port,
          connection.decision?.label,
          connection.egressDecision?.label,
          connection.revoked,
        ].join('|')
      : connection.key

    const row = groups.get(key) ?? { ...connection, key, count: 0, states: new Map() }

    row.count++
    row.states.set(label, (row.states.get(label) ?? 0) + 1)
    groups.set(key, row)
  }

  return [...groups.values()].sort((rowA, rowB) => rowB.count - rowA.count)
})

const { pageRecords: pageRows, paginationBindings } = usePagination('vdf-live-connections', rows, {
  ignoreRoute: true,
})

const state = useTableState({
  empty: () =>
    connections.length === 0
      ? { type: 'no-data', message: t('firewall:live:no-connection'), size: 'extra-small' }
      : rows.value.length === 0
        ? { type: 'no-result' }
        : false,
})

const useConnectionColumns = defineColumns(() => ({
  source: useLiteralColumn({ headerLabel: () => t('firewall:source') }),
  destination: useLiteralColumn({ headerLabel: () => t('firewall:destination') }),
  service: useLiteralColumn({ headerLabel: () => t('firewall:service') }),
  allowedBy: useLiteralColumn({ headerLabel: () => t('firewall:live:let-in-by') }),
  // grouped, how many connections of each state ("30 Open")
  state: useLiteralColumn({
    headerLabel: () => (isGrouped.value ? t('firewall:live:connections:count') : t('firewall:live:state')),
  }),
  actions: useVdfActionsColumn(),
}))

const { HeadCells, BodyCells, toggle } = useConnectionColumns({
  body: (row: Row) => ({
    source: r => r(h(VdfEndpoint, { scopeId, ...row.src })),
    destination: r => r(h(VdfEndpoint, { scopeId, ...row.dst })),
    service: r => r(h(VdfService, { proto: row.proto, port: row.port })),
    // out by the source's egress, then in by the destination's ingress
    allowedBy: r =>
      r(
        h('span', { class: 'decisions' }, [
          row.egressDecision ? h(VdfDecisionCell, { decision: row.egressDecision, egress: true }) : null,
          row.decision || !row.egressDecision
            ? h(VdfDecisionCell, {
                decision: row.decision,
                fallback: t('firewall:live:no-rule'),
                fallbackIsSecondary: true,
              })
            : null,
        ])
      ),
    state: r =>
      r(
        h('span', { class: 'states typo-body-regular-small' }, [
          h(
            'span',
            [...row.states]
              .map(([label, count]) =>
                isGrouped.value ? t('firewall:live:state:count', { n: n(count), state: label }) : label
              )
              .join(', ')
          ),
          row.revoked
            ? h(UiTag, { accent: 'danger', variant: 'secondary' }, () =>
                row.revokedByEgress ? t('firewall:live:revoked-egress') : t('firewall:live:revoked')
              )
            : null,
        ])
      ),
    // the source, when it's a VM of this pool
    actions: r => r(row.src.vm?.$pool === scopeId ? [quarantineAction(row.src.vm, { named: true })] : []),
  }),
})

// a source VM of this pool to quarantine: no empty column otherwise
watchEffect(() =>
  toggle(
    'actions',
    rows.value.some(row => row.src.vm?.$pool === scopeId)
  )
)
</script>

<style lang="postcss" scoped>
.vdf-connections-table {
  /* its endpoints narrow on a laptop */
  container: vdf-table / inline-size;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;

    /* its own line rather than a clipped Search button */
    .search {
      flex: 1;
      min-width: min(100%, 52rem);

      /* its field shrinks before the Search button is cut */
      :deep(.ui-input),
      :deep(input) {
        min-width: 0;
      }
    }
  }

  :deep(.decisions) {
    display: inline-flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  :deep(.states) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
    font-variant-numeric: tabular-nums;
  }

  /* on a laptop: one state per line */
  @container vdf-table (max-width: 100rem) {
    :deep(.states) {
      max-width: 14rem;
    }
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
