<template>
  <div ref="root" class="vdf-rule-log-table">
    <div class="toolbar">
      <UiRadioButtonGroup accent="brand" gap="wide" role="radiogroup" :aria-label="t('firewall:log:verdict')">
        <UiRadioButton v-for="option of verdicts" :key="option" v-model="verdict" :value="option" accent="brand">
          {{ t(`firewall:log:verdict:${option}`) }}
        </UiRadioButton>
      </UiRadioButtonGroup>
      <UiQuerySearchBar class="search" @search="value => (search = value)" />
      <VdfLiveIndicator v-if="paused === undefined" v-model:paused="isPaused" :label="t('firewall:log:refreshing')" />
    </div>
    <UiAlert v-if="hasRuleLogError && isRuleLogReady" accent="warning">
      {{ t('firewall:log:stale', { error: ruleLogError?.message ?? '' }) }}
    </UiAlert>
    <UiAlert v-for="host of ruleLog?.errors ?? []" :key="host.hostName" accent="warning">
      {{ t('firewall:log:host-error', { host: host.hostName, error: host.error }) }}
    </UiAlert>
    <div v-if="chart && logSeries !== undefined" class="chart">
      <span class="typo-body-regular-small secondary">{{ logCaption }}</span>
      <VdfRateChart :series="logSeries" unit="minute" />
    </div>
    <VtsTable :state :pagination-bindings :horizontal="vmName !== undefined">
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="row of pageRows" :key="row.key" :class="{ fresh: isFreshDrop(row) }">
          <BodyCells :item="row" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useVdfActionsColumn } from '@/modules/vdf/components/live/vdf-actions-column.ts'
import { useEndColumn } from '@/modules/vdf/components/live/vdf-end-column.ts'
import VdfDecisionCell from '@/modules/vdf/components/live/VdfDecisionCell.vue'
import VdfEndpoint from '@/modules/vdf/components/live/VdfEndpoint.vue'
import VdfLiveIndicator from '@/modules/vdf/components/live/VdfLiveIndicator.vue'
import VdfRateChart from '@/modules/vdf/components/live/VdfRateChart.vue'
import VdfService from '@/modules/vdf/components/live/VdfService.vue'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import { useVdfDecision, type VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import { useVdfRuleLogSeries } from '@/modules/vdf/composables/vdf-rule-log-series.composable.ts'
import { useVdfTraceDrawer } from '@/modules/vdf/composables/vdf-trace-drawer.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { allowFlowRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { emptyDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { computed, h, ref, useTemplateRef, watch, watchEffect, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const {
  poolId,
  vmName,
  paused,
  chart = true,
} = defineProps<{
  poolId: string
  // only the entries of this VM's VIFs (as destination or source)
  vmName?: string
  // the page's live updates, paused or not: one control for the page
  // (Traffic); without it, the table's own
  paused?: boolean
  // its per-minute chart (Traffic draws the log's beside its rates)
  chart?: boolean
}>()

const { t, d } = useI18n()

const router = useRouter()

const { openTrace } = useVdfTraceDrawer()

const { quarantineAction } = useVdfQuarantine(() => poolId)

const isPaused = ref(false)

const { ruleLog, isRuleLogReady, hasRuleLogError, ruleLogError } = useVdfRuleLog(
  { isEnabled: computed(() => !(paused ?? isPaused.value)) },
  () => poolId
)

// names as hosts enforce them: the published document's
const { publishedPolicy } = useVdfPublishedPolicy({}, () => poolId)

const publishedDocument = computed(() => publishedPolicy.value?.document ?? emptyDocument())

const { vmByIp, vmByName, groupsOfIp } = useVdfIpNames(publishedDocument)

// a VM of this pool, which its trace knows (another pool's is an address)
const ofPool = <T extends { $pool: string }>(vm: T | undefined) => (vm?.$pool === poolId ? vm : undefined)

const { decision } = useVdfDecision(() => poolId, publishedDocument)

const verdicts = ['all', 'drop', 'allow'] as const

const verdict = ref<(typeof verdicts)[number]>('all')

const search = ref('')

type Row = {
  key: string
  entry: VdfRuleLogEntry
  source: { ip: string; vm: FrontXoVm | undefined }
  destination: FrontXoVm | undefined
  decision: VdfDecision
  why: VdfTraceQuery | undefined
}

const vmEntries = computed(() =>
  [...(ruleLog.value?.entries ?? [])]
    .reverse()
    .filter(entry => vmName === undefined || entry.vm === vmName || vmByIp.value.get(entry.src)?.name_label === vmName)
)

// FRESH DROPS: a drop logged since the table last refreshed slides in with
// a red highlight that fades, after the first load and whatever the
// filters (a filter shows known entries again, never as new)
const entryId = (entry: VdfRuleLogEntry) =>
  [entry.host, entry.time, entry.rule, entry.src, entry.sport, entry.dst, entry.dport].join('|')

const seenIds = new Set<string>()

// marked for as long as their highlight lasts (the list is computed again
// meanwhile)
const FRESH_MS = 3000

const freshIds = ref(new Set<string>())

watch(vmEntries, entries => {
  const isFirst = seenIds.size === 0
  const fresh: string[] = []

  for (const entry of entries) {
    const id = entryId(entry)

    if (!seenIds.has(id)) {
      seenIds.add(id)

      if (!isFirst && entry.verdict === 'DROP') {
        fresh.push(id)
      }
    }
  }

  if (fresh.length > 0) {
    freshIds.value = new Set([...freshIds.value, ...fresh])
    setTimeout(() => {
      freshIds.value = new Set([...freshIds.value].filter(id => !fresh.includes(id)))
    }, FRESH_MS)
  }
})

const isFreshDrop = (row: Row) => freshIds.value.has(entryId(row.entry))

const rows = computed<Row[]>(() => {
  const term = search.value.trim().toLocaleLowerCase()

  // keys stay the same as new entries come in (a row's open menu with
  // them): what the entry is, numbered when it repeats
  const seen = new Map<string, number>()

  return vmEntries.value
    .filter(entry => verdict.value === 'all' || entry.verdict === verdict.value.toUpperCase())
    .map(entry => {
      // the log names the VM whose policy decided: the destination, or for
      // egress (vdf#53) the source
      const named = entry.vm ? vmByName.value.get(entry.vm) : undefined
      const sourceVm = entry.egress ? (named ?? vmByIp.value.get(entry.src)) : vmByIp.value.get(entry.src)
      const destination = entry.egress ? vmByIp.value.get(entry.dst) : named
      const id = entryId(entry)
      const repeat = seen.get(id) ?? 0

      seen.set(id, repeat + 1)

      return {
        key: `${id}|${repeat}`,
        entry,
        source: { ip: entry.src, vm: sourceVm },
        destination,
        decision: decision(entry),
        // a VM of another pool is an address to this pool's trace
        why: whyQuery(entry, ofPool(sourceVm)?.id, ofPool(destination)?.id),
      }
    })
    .filter(
      row =>
        term === '' ||
        [
          row.entry.vm,
          row.entry.src,
          row.entry.dst,
          row.entry.dport,
          row.entry.label,
          row.source.vm?.name_label,
          row.decision.label,
          ...groupsOfIp(row.entry.src),
        ].some(value => value?.toLocaleLowerCase().includes(term))
    )
})

const { pageRecords: pageRows, paginationBindings } = usePagination('vdf-rule-log', rows)

// CHART (vdf#59): what the table shows (its filters: verdict, search, a
// policy's name), per minute; on Traffic, the page draws the whole log's
// beside its rates (chart: false)
const { logSeries, logCaption } = useVdfRuleLogSeries(
  () => ruleLog.value?.entries ?? [],
  () => rows.value.map(row => row.entry)
)

const state = useTableState({
  busy: () => !isRuleLogReady.value && !hasRuleLogError.value,
  error: () => (!isRuleLogReady.value && hasRuleLogError.value ? t('firewall:log:error') : false),
  // compact inside a VM's page
  empty: () => {
    const size = vmName === undefined ? undefined : 'extra-small'

    if ((ruleLog.value?.entries.length ?? 0) === 0) {
      return { type: 'no-data', message: t('firewall:log:empty'), size }
    }

    if (vmEntries.value.length === 0) {
      return { type: 'no-data', message: t('firewall:log:empty:vm'), size }
    }

    return rows.value.length === 0 ? { type: 'no-result', size } : false
  },
})

// the same packet, traced (in the trace drawer): the log says what decided,
// the trace says why
function whyQuery(entry: VdfRuleLogEntry, sourceId?: string, destinationId?: string): VdfTraceQuery | undefined {
  const proto = entry.proto.split(' ')[0].toLowerCase()

  // egress (vdf#53): from the logged VM to any address
  const known = entry.egress ? sourceId : destinationId

  if (known === undefined || !['tcp', 'udp', 'icmp'].includes(proto)) {
    return undefined
  }

  return {
    from: sourceId ?? 'external',
    fromip: sourceId === undefined ? entry.src : undefined,
    to: destinationId ?? 'external',
    toip: destinationId === undefined ? entry.dst : undefined,
    proto,
    port: entry.dport || undefined,
    run: '1',
  }
}

// a row's menu: allow a drop (the rule drawer, prefilled, in the policy
// that dropped it), trace it, and, apart, quarantine the source when it's
// a VM of this pool
function rowActions(row: Row): ActionItem[] {
  const proto = row.entry.proto.split(' ')[0].toLowerCase()
  const allow =
    row.entry.verdict === 'DROP' && ['tcp', 'udp', 'icmp'].includes(proto)
      ? allowFlowRoute(poolId, {
          policy: row.entry.policy,
          egress: row.entry.egress,
          peer: row.entry.egress ? row.entry.dst : row.entry.src,
          proto,
          port: row.entry.dport,
        })
      : undefined

  return [
    ...(allow === undefined
      ? []
      : [{ label: t('firewall:trace:allow-flow'), icon: 'fa:plus' as const, onClick: () => router.push(allow) }]),
    ...(row.why === undefined
      ? []
      : [
          { label: t('firewall:monitor:trace'), icon: 'fa:route' as const, onClick: () => openTrace(poolId, row.why!) },
        ]),
    ...(row.source.vm?.$pool === poolId ? [quarantineAction(row.source.vm, { named: true })] : []),
  ]
}

// a row's trace button
function traceButton(row: Row) {
  // egress (vdf#53): the logged VM is the source, the destination an address
  const to = row.entry.egress ? (row.destination?.name_label ?? row.entry.dst) : row.entry.vm
  const label = t('firewall:live:trace', { from: row.source.vm?.name_label ?? row.entry.src, to })

  return withDirectives(
    h(UiButtonIcon, {
      icon: 'fa:route',
      size: 'small',
      accent: 'brand',
      'aria-label': label,
      onClick: () => openTrace(poolId, row.why!),
    }),
    [[vTooltip, label]]
  )
}

// on a laptop (XO's tree open): 8 columns don't fit
const isNarrow = useVdfNarrow(useTemplateRef('root'), 100)

// One line, so that a row stays one line high: the time, with its date
// only when not today, both on hover
// Narrow: the outcome too, as an icon before it (the Outcome column
// hidden), said on hover
function timeCell(time: string, verdict: string) {
  const date = new Date(time)
  const isToday = date.toDateString() === new Date().toDateString()
  const clock = d(date, { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const isAllowed = verdict === 'ALLOW'
  const outcome = t(`firewall:log:verdict:${isAllowed ? 'allow' : 'drop'}`)

  return withDirectives(
    h('time', { class: 'time typo-body-regular-small', datetime: time }, [
      isNarrow.value
        ? h(VtsIcon, {
            class: isAllowed ? 'allowed' : 'dropped',
            name: isAllowed ? 'fa:circle-check' : 'fa:ban',
            size: 'medium',
            'aria-label': outcome,
          })
        : null,
      isToday ? null : h('span', { class: 'secondary' }, d(date, { month: 'short', day: 'numeric' })),
      h('span', clock),
    ]),
    [
      [
        vTooltip,
        (isNarrow.value ? `${outcome} · ` : '') +
          d(date, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
      ],
    ]
  )
}

const useLogColumns = defineColumns(() => ({
  time: useLiteralColumn({ headerLabel: () => t('firewall:log:time') }),
  verdict: useTagColumn({ headerLabel: () => t('firewall:log:verdict') }),
  source: useLiteralColumn({ headerLabel: () => t('firewall:source') }),
  destination: useLiteralColumn({ headerLabel: () => t('firewall:destination') }),
  service: useLiteralColumn({ headerLabel: () => t('firewall:service') }),
  decidedBy: useLiteralColumn({ headerLabel: () => t('firewall:log:decided-by') }),
  label: useTruncatedTextColumn({ headerLabel: () => t('firewall:log:label') }),
  why: useEndColumn({ headerLabel: () => t('firewall:live:why') }),
  actions: useVdfActionsColumn(),
}))

const { HeadCells, BodyCells, toggle } = useLogColumns({
  body: (row: Row) => ({
    time: r => r(timeCell(row.entry.time, row.entry.verdict)),
    verdict: r =>
      r(
        t(`firewall:log:verdict:${row.entry.verdict === 'ALLOW' ? 'allow' : 'drop'}`),
        row.entry.verdict === 'ALLOW' ? 'success' : 'danger'
      ),
    source: r =>
      r(
        h(VdfEndpoint, {
          scopeId: poolId,
          ip: row.entry.src,
          vm: row.source.vm,
          name: row.source.vm === undefined && row.entry.egress ? row.entry.vm : undefined,
          groups: row.source.vm === undefined ? groupsOfIp(row.entry.src) : [],
          compact: isNarrow.value,
        })
      ),
    destination: r =>
      r(
        h(VdfEndpoint, {
          scopeId: poolId,
          ip: row.entry.dst,
          vm: row.destination,
          // the log names the VM whose policy decided: the destination, unless egress
          name: row.destination === undefined && !row.entry.egress ? row.entry.vm : undefined,
          compact: isNarrow.value,
        })
      ),
    service: r => r(h(VdfService, { proto: row.entry.proto.split(' ')[0], port: row.entry.dport })),
    decidedBy: r => {
      // outbound: the icon before the rule, and its tooltip. Narrow: the
      // label in its tooltip, not a column of its own
      const cell = h(
        VdfDecisionCell,
        { decision: row.decision, egress: row.entry.egress, note: isNarrow.value ? row.entry.label : undefined },
        () => [
          row.entry.suppressed
            ? h(
                'span',
                { class: 'typo-body-regular-small secondary' },
                t('firewall:log:suppressed', { n: row.entry.suppressed })
              )
            : null,
        ]
      )

      // narrow: the trace button beside what decided, not in a column of its own
      return r(
        isNarrow.value && row.why !== undefined ? h('span', { class: 'decided' }, [cell, traceButton(row)]) : cell
      )
    },
    label: r => r(row.entry.label ?? ''),
    why: r => r(row.why === undefined ? '' : traceButton(row)),
    actions: r => r(rowActions(row)),
  }),
})

watchEffect(() => toggle('why', !isNarrow.value))

// narrow: the outcome as an icon in the time's cell
watchEffect(() => toggle('verdict', !isNarrow.value))

// labels are optional: no column of "None". Narrow: in what decided's
// tooltip
watchEffect(() => toggle('label', !isNarrow.value && rows.value.some(row => row.entry.label)))
</script>

<style lang="postcss" scoped>
.vdf-rule-log-table {
  /* a drop just logged: in, then its highlight fades (on the cells, which
     paint their own background) */
  .fresh {
    animation: fresh-in 0.4s ease-out both;

    :deep(td) {
      animation: fresh-drop 2.5s ease-out both;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;

      :deep(td) {
        animation: none;
      }
    }
  }

  @keyframes fresh-in {
    from {
      opacity: 0;
      transform: translateY(-0.8rem);
    }
  }

  @keyframes fresh-drop {
    0%,
    30% {
      background-color: color-mix(in srgb, var(--color-danger-item-base) 22%, var(--color-neutral-background-primary));
    }
  }

  /* its endpoints narrow on a laptop */
  container: vdf-table / inline-size;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .chart {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem 2.4rem;

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

  :deep(.decided) {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  :deep(.time) {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    .allowed {
      color: var(--color-success-item-base);
    }

    .dropped {
      color: var(--color-danger-item-base);
    }
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
