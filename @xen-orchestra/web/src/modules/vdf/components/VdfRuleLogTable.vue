<template>
  <div ref="root" class="vdf-rule-log-table">
    <div class="toolbar">
      <UiRadioButtonGroup accent="brand" gap="wide" role="radiogroup" :aria-label="t('firewall:log:verdict')">
        <UiRadioButton v-for="option of verdicts" :key="option" v-model="verdict" :value="option" accent="brand">
          {{ t(`firewall:log:verdict:${option}`) }}
        </UiRadioButton>
      </UiRadioButtonGroup>
      <UiQuerySearchBar class="search" @search="value => (search = value)" />
      <VdfLiveIndicator v-model:paused="isPaused" :label="t('firewall:log:refreshing')" />
    </div>
    <UiAlert v-if="hasRuleLogError && isRuleLogReady" accent="warning">
      {{ t('firewall:log:stale', { error: ruleLogError?.message ?? '' }) }}
    </UiAlert>
    <UiAlert v-for="host of ruleLog?.errors ?? []" :key="host.hostName" accent="warning">
      {{ t('firewall:log:host-error', { host: host.hostName, error: host.error }) }}
    </UiAlert>
    <div v-if="logSeries !== undefined" class="chart">
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
        <VtsRow v-for="row of pageRows" :key="row.key">
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
import { useVdfDecision, type VdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfNarrow } from '@/modules/vdf/composables/vdf-narrow.composable.ts'
import { useVdfQuarantine } from '@/modules/vdf/composables/vdf-quarantine.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { allowFlowRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { emptyDocument } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { logRateSeries } from '@/modules/vdf/utils/vdf-rate-series.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ActionItem } from '@core/components/menu/VtsActionsMenu.vue'
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
import { computed, h, ref, useTemplateRef, watchEffect, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

const { poolId, vmName } = defineProps<{
  poolId: string
  // only the entries of this VM's VIFs (as destination or source)
  vmName?: string
}>()

const { t, d } = useI18n()

const router = useRouter()

const { quarantineAction } = useVdfQuarantine()

const isPaused = ref(false)

const { ruleLog, isRuleLogReady, hasRuleLogError, ruleLogError } = useVdfRuleLog(
  { isEnabled: computed(() => !isPaused.value) },
  () => poolId
)

// names as hosts enforce them: the published document's
const { publishedPolicy } = useVdfPublishedPolicy({}, () => poolId)

const publishedDocument = computed(() => publishedPolicy.value?.document ?? emptyDocument())

const { vmByIp, vmByName, groupsOfIp } = useVdfIpNames(publishedDocument)

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
  why: RouteLocationRaw | undefined
}

const vmEntries = computed(() =>
  [...(ruleLog.value?.entries ?? [])]
    .reverse()
    .filter(entry => vmName === undefined || entry.vm === vmName || vmByIp.value.get(entry.src)?.name_label === vmName)
)

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
      const id = [entry.host, entry.time, entry.rule, entry.src, entry.sport, entry.dst, entry.dport].join('|')
      const repeat = seen.get(id) ?? 0

      seen.set(id, repeat + 1)

      return {
        key: `${id}|${repeat}`,
        entry,
        source: { ip: entry.src, vm: sourceVm },
        destination,
        decision: decision(entry),
        why: whyRoute(entry, sourceVm?.id, destination?.id),
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
// policy's name), per minute, over the last hour or as far back as the
// log's last lines go
const LOG_WINDOW_MS = 60 * 60_000

const LOG_BUCKET_MS = 60_000

const logSince = computed(() => {
  const times = (ruleLog.value?.entries ?? []).map(entry => Date.parse(entry.time)).filter(time => !Number.isNaN(time))

  if (times.length === 0) {
    return undefined
  }

  return Math.max(Math.min(...times), Date.now() - LOG_WINDOW_MS)
})

const logSeries = computed(() => {
  // a single minute isn't a trend: the table says it all; nothing logged
  // (UX P3-6): no empty chart, the table's empty state says it
  if (logSince.value === undefined || Date.now() - logSince.value < 2 * LOG_BUCKET_MS || rows.value.length === 0) {
    return undefined
  }

  // complete minutes only: the one in progress would always dip at the end
  return logRateSeries(
    rows.value.map(row => row.entry),
    {
      since: logSince.value,
      until: Math.floor(Date.now() / LOG_BUCKET_MS) * LOG_BUCKET_MS - 1,
      bucketMs: LOG_BUCKET_MS,
    }
  )
})

const logCaption = computed(() =>
  logSince.value === undefined
    ? ''
    : t('firewall:log:chart', {
        time: d(new Date(logSince.value), { hour: '2-digit', minute: '2-digit' }),
      })
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

// the same packet, traced: the log says what decided, the trace says why
function whyRoute(entry: VdfRuleLogEntry, sourceId?: string, destinationId?: string): RouteLocationRaw | undefined {
  const proto = entry.proto.split(' ')[0].toLowerCase()

  // egress (vdf#53): from the logged VM to any address
  const known = entry.egress ? sourceId : destinationId

  if (known === undefined || !['tcp', 'udp', 'icmp'].includes(proto)) {
    return undefined
  }

  return {
    name: '/pool/[id]/firewall/trace',
    params: { id: poolId },
    query: {
      from: sourceId ?? 'external',
      fromip: sourceId === undefined ? entry.src : undefined,
      to: destinationId ?? 'external',
      toip: destinationId === undefined ? entry.dst : undefined,
      proto,
      port: entry.dport || undefined,
      run: '1',
    },
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
      : [{ label: t('firewall:monitor:trace'), icon: 'fa:route' as const, onClick: () => router.push(row.why!) }]),
    ...(row.source.vm?.$pool === poolId ? [quarantineAction(row.source.vm, { named: true })] : []),
  ]
}

// a row's trace button
function traceButton(row: Row) {
  const label = t('firewall:live:trace', { from: row.source.vm?.name_label ?? row.entry.src, to: row.entry.vm })

  return withDirectives(
    h(UiButtonIcon, {
      icon: 'fa:route',
      size: 'small',
      accent: 'brand',
      'aria-label': label,
      onClick: () => router.push(row.why!),
    }),
    [[vTooltip, label]]
  )
}

// on a laptop (XO's tree open): 8 columns don't fit
const isNarrow = useVdfNarrow(useTemplateRef('root'), 100)

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
    time: r =>
      r(
        // the time over its date: a narrow column
        h('time', { class: 'time typo-body-regular-small', datetime: row.entry.time }, [
          h('span', d(new Date(row.entry.time), { hour: '2-digit', minute: '2-digit', second: '2-digit' })),
          h('span', { class: 'secondary' }, d(new Date(row.entry.time), { month: 'short', day: 'numeric' })),
        ])
      ),
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
        })
      ),
    service: r => r(h(VdfService, { proto: row.entry.proto.split(' ')[0], port: row.entry.dport })),
    decidedBy: r => {
      const cell = h(VdfDecisionCell, { decision: row.decision }, () => [
        row.entry.egress ? h('span', { class: 'typo-body-regular-small secondary' }, t('firewall:log:egress')) : null,
        row.entry.suppressed
          ? h(
              'span',
              { class: 'typo-body-regular-small secondary' },
              t('firewall:log:suppressed', { n: row.entry.suppressed })
            )
          : null,
      ])

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

// labels are optional: no column of "None"
watchEffect(() =>
  toggle(
    'label',
    rows.value.some(row => row.entry.label)
  )
)
</script>

<style lang="postcss" scoped>
.vdf-rule-log-table {
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
    flex-direction: column;
    gap: 0.2rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  :deep(.secondary) {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
