<template>
  <div class="vdf-monitor-report">
    <UiAlert v-if="hasMonitorError && isMonitorReady" accent="warning">
      {{ t('firewall:monitor:stale', { error: monitorError?.message ?? '' }) }}
    </UiAlert>
    <UiAlert v-for="host of monitor?.errors ?? []" :key="host.host" accent="warning">
      {{ t('firewall:log:host-error', { host: host.hostName, error: host.error }) }}
    </UiAlert>

    <VtsStateHero v-if="monitoredPolicies.length === 0" format="card" type="no-data" size="small">
      <div class="empty">
        <span>{{ t('firewall:monitor:none') }}</span>
        <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: poolId } }" size="medium">
          {{ t('firewall:manage-policies') }}
        </UiLink>
      </div>
    </VtsStateHero>

    <template v-else>
      <div class="toolbar">
        <VtsInputWrapper :label="t('firewall:policy')" class="policy-filter">
          <VtsSelect :id="policySelectId" accent="brand" />
        </VtsInputWrapper>
        <UiQuerySearchBar class="search" @search="value => (search = value)" />
        <UiToggle v-model="showExpired">{{ t('firewall:monitor:show-expired') }}</UiToggle>
        <UiToggle v-if="expectedCount > 0" v-model="showExpected">
          {{ t('firewall:monitor:show-expected', { n: expectedCount }, expectedCount) }}
        </UiToggle>
        <UiToggle v-if="coveredCount > 0" v-model="showCovered">
          {{ t('firewall:monitor:show-covered', { n: coveredCount }, coveredCount) }}
        </UiToggle>
      </div>

      <!-- vdf#86: an enforced policy decides first for some of the VMs -->
      <UiAlert v-if="shadows.length > 0" accent="warning">
        {{ t('firewall:monitor:shadow:title', { n: shadows.length }, shadows.length) }}
        <template #description>
          <ul class="shadows">
            <li v-for="shadow of shadows" :key="shadowKey(shadow)">{{ shadowText(shadow) }}</li>
          </ul>
        </template>
      </UiAlert>

      <section v-for="group of suggestionGroups" :key="group.policy.name" class="suggestions">
        <div class="suggestions-title">
          <span class="typo-body-bold">
            {{
              t('firewall:monitor:suggested', { policy: displayName(group.policy.name), n: group.suggestions.length })
            }}
          </span>
          <UiButton
            v-if="!group.isGlobal && group.pending.length > 1"
            variant="secondary"
            accent="brand"
            size="small"
            left-icon="fa:plus"
            @click="addAll(group.policy.name, group.pending)"
          >
            {{ t('firewall:monitor:add-all', { n: group.pending.length }) }}
          </UiButton>
          <UiLink
            v-if="group.isGlobal"
            size="small"
            icon="fa:globe"
            :to="vdfGlobalRoute('policies', { policy: group.policy.name })"
          >
            {{ t('firewall:global:edit-xo-wide') }}
          </UiLink>
        </div>
        <ul class="suggestion-list">
          <li v-for="suggestion of group.suggestions" :key="suggestionKey(suggestion)" class="suggestion">
            <VdfActionTag action="allow" />
            <span class="typo-body-regular-small">
              {{
                t(
                  suggestion.rule.to === undefined
                    ? 'firewall:monitor:suggestion'
                    : 'firewall:monitor:suggestion:egress',
                  suggestionText(suggestion)
                )
              }}
            </span>
            <span class="secondary typo-body-regular-small">
              {{ t('firewall:monitor:seen', { n: suggestion.count }) }}
            </span>
            <span v-if="suggestion.before !== undefined" class="secondary typo-body-regular-small">
              {{ t('firewall:monitor:before-rule', { id: suggestion.before }) }}
            </span>
            <UiTag v-if="isInDraft(suggestion)" accent="success" variant="secondary">
              {{ t('firewall:monitor:in-draft') }}
            </UiTag>
            <UiButton
              v-else-if="!group.isGlobal"
              variant="tertiary"
              accent="brand"
              size="small"
              left-icon="fa:plus"
              @click="addToDraft(suggestion)"
            >
              {{ t('firewall:monitor:add') }}
            </UiButton>
          </li>
        </ul>
      </section>

      <VtsTable :state :pagination-bindings>
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
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfEndpoint from '@/modules/vdf/components/live/VdfEndpoint.vue'
import VdfService from '@/modules/vdf/components/live/VdfService.vue'
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfMonitorExpected } from '@/modules/vdf/composables/vdf-monitor-expected.composable.ts'
import { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import { useVdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { useVdfMonitor } from '@/modules/vdf/remote-resources/use-vdf-monitor.ts'
import type { VdfMonitorEntry, VdfPolicy } from '@/modules/vdf/types.ts'
import { displayName, globalRuleId, isGlobalName, vdfGlobalRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import {
  coveringRule,
  isMonitored,
  liveEntries,
  MONITOR_OTHER,
  monitorFlowKey,
  suggestRules,
  type VdfSuggestion,
} from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupNetworks, isOnNetworks } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { formatPorts, nextRuleId, ruleAction, vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { portsContain } from '@/modules/vdf/utils/vdf-ports.util.ts'
import { rulesOf } from '@/modules/vdf/utils/vdf-rules.util.ts'
import { shadowKey } from '@/modules/vdf/utils/vdf-shadow.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsRelativeTime from '@core/components/relative-time/VtsRelativeTime.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useFormSelect } from '@core/packages/form-select'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { computed, h, ref, withDirectives } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

// What the pool's policies in monitor mode would drop if enforced (vdf#13):
// suggested rules per policy, then every flow, each with "allow this". An
// egress would-be drop (vdf#53) is what the VM starts: from it to a
// destination, allowed by an outbound rule.
const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const router = useRouter()

const poolId = computed(() => pool.id)

const { monitor, isMonitorReady, hasMonitorError, monitorError } = useVdfMonitor({}, () => pool.id)

// what's published (the report is about it) and the draft (where rules go)
const { document, publishedDocument, saveRule } = useVdfScope(() => ({ kind: 'pool' as const, pool }))

const { vmByIp, groupsOfIp } = useVdfIpNames(publishedDocument)

const { netTagsOfAddress, interfaceLabel, vifLabel, interfacesOf } = useVdfInterfaces()

const { membersOf } = useVdfMembers(() => pool.id, publishedDocument)

const { vms } = useXoVmCollection()

const monitoredPolicies = computed(() => publishedDocument.value.policies.filter(isMonitored))

const ALL = '\0all'

const selectedPolicy = ref(ALL)

const policyOptions = computed(() => [
  { name: ALL, label: t('firewall:monitor:all-policies') },
  ...monitoredPolicies.value.map(policy => ({ name: policy.name, label: displayName(policy.name) })),
])

const { id: policySelectId } = useFormSelect(policyOptions, {
  model: selectedPolicy,
  option: { id: 'name', value: 'name', label: 'label' },
})

const search = ref('')

const showExpired = ref(false)

// would-be drops marked expected: hidden unless asked, never suggested
const { isExpected, setExpected } = useVdfMonitorExpected(poolId)

const showExpected = ref(false)

// a source (or an egress destination), as a rule would name it: the most
// specific tagged group its VM belongs to, a group listing the address,
// else the address. A VM of another pool is in a tagged group's members
// only for a global group (XO adds the other pools' members to those): the
// pool's own groups resolve on its hosts, among its own VMs.
// A group scoped to networks (vdf#36) names the address only if it's on
// one of its networks, and wins a tie: the rule then covers that interface
// of the VM, not its others.
// A pool policy's rule prefers the pool's own group to a global one of the
// same reach (both can be named `admins`); a global policy's rule can only
// name a global group.
function sourceOf(address: string, policyName = '') {
  const vm = vmByIp.value.get(address)
  const groups = publishedDocument.value.groups
  const forGlobal = isGlobalName(policyName)
  const usable = (name: string) => !forGlobal || isGlobalName(name)
  const ownFirst = (a: string, b: string) => Number(isGlobalName(a)) - Number(isGlobalName(b))

  if (vm !== undefined) {
    const netTags = netTagsOfAddress(vm, address)
    const scoped = (name: string) => groupNetworks(groups[name]).length > 0
    const tagged = vmGroupNames(vm.tags, publishedDocument.value)
      .filter(name => (groups[name]?.tags?.length ?? 0) > 0)
      .filter(name => (vm.$pool === pool.id || isGlobalName(name)) && usable(name))
      .filter(name => !scoped(name) || (netTags !== undefined && isOnNetworks(netTags, groupNetworks(groups[name]))))
      .sort(
        (a, b) =>
          membersOf(a).length - membersOf(b).length ||
          Number(scoped(b)) - Number(scoped(a)) ||
          ownFirst(a, b) ||
          a.localeCompare(b)
      )

    if (tagged.length > 0) {
      return tagged[0]
    }
  }

  return groupsOfIp(address).filter(usable).sort(ownFirst)[0] ?? address
}

const shownPolicies = computed(() =>
  monitoredPolicies.value.filter(policy => selectedPolicy.value === ALL || policy.name === selectedPolicy.value)
)

// VMs a monitored policy can't see (vdf#86): an enforced policy of its tier,
// or an earlier tier deciding everything, decides first for them
const { shadowsIn, shadowText } = useVdfMonitorShadows()

const shadows = computed(() => {
  const names = new Set(shownPolicies.value.map(policy => policy.name))

  return shadowsIn(
    publishedDocument.value,
    vms.value.filter(vm => vm.$pool === pool.id).map(vm => ({ vm }))
  ).filter(shadow => names.has(shadow.policy))
})

// SUGGESTED RULES, per monitored policy (the pool's own are added to the
// draft from here; a global one is edited in the global firewall)

function draftPolicy(name: string) {
  return document.value.policies.find(policy => policy.name === name)
}

function isInDraft(suggestion: VdfSuggestion) {
  const policy = draftPolicy(suggestion.policy)
  const egress = suggestion.rule.to !== undefined

  return (policy === undefined ? [] : rulesOf(policy, egress ? 'egress' : 'ingress')).some(
    rule =>
      ruleAction(rule) === 'allow' &&
      (egress ? rule.to === suggestion.rule.to : rule.from === suggestion.rule.from) &&
      rule.proto === suggestion.rule.proto &&
      (suggestion.rule.ports ?? []).every(port => portsContain(rule.ports, port))
  )
}

const suggestionGroups = computed(() =>
  shownPolicies.value
    .map((policy: VdfPolicy) => {
      // what a published rule now allows needs none
      const suggestions = suggestRules(
        (monitor.value?.entries ?? []).filter(entry => !isExpected(entry) && coveringRuleId(entry) === undefined),
        policy,
        address => sourceOf(address, policy.name)
      )

      return {
        policy,
        isGlobal: isGlobalName(policy.name),
        suggestions,
        pending: suggestions.filter(suggestion => !isInDraft(suggestion)),
      }
    })
    .filter(group => group.suggestions.length > 0)
)

const suggestionKey = (suggestion: VdfSuggestion) =>
  `${suggestion.policy}|${suggestion.rule.from ?? ''}|${suggestion.rule.to ?? ''}|${suggestion.rule.proto}|${suggestion.before ?? ''}`

function suggestionText(suggestion: VdfSuggestion) {
  const { from, to, proto, ports } = suggestion.rule

  // "db (global)": a pool's own group can have the same name
  const name = (group: string) =>
    isGlobalName(group) ? t('firewall:global-name', { name: displayName(group) }) : displayName(group)

  return {
    from: name(from ?? ''),
    to: name(to ?? ''),
    service:
      ports === undefined || ports.length === 0 ? proto.toUpperCase() : `${proto.toUpperCase()} ${formatPorts(ports)}`,
  }
}

function addToDraft(suggestion: VdfSuggestion) {
  saveRule(
    suggestion.policy,
    undefined,
    { id: nextRuleId(document.value, publishedDocument.value), ...suggestion.rule },
    suggestion.before
  )
}

function addAll(_policy: string, suggestions: VdfSuggestion[]) {
  for (const suggestion of suggestions) {
    addToDraft(suggestion)
  }
}

// EVERY FLOW

type Row = {
  key: string
  entry: VdfMonitorEntry
  allow: RouteLocationRaw | undefined
  trace: RouteLocationRaw | undefined
  expected: boolean
  // the published rule that now allows it (the entry stays for 7 days)
  coveredBy: number | undefined
}

// the groups an address belongs to: those listing it, and its VM's tagged
// groups (one scoped to networks, vdf#36, only on them)
function groupsOf(address: string) {
  const vm = vmByIp.value.get(address)
  const netTags = vm === undefined ? undefined : netTagsOfAddress(vm, address)
  const groups = publishedDocument.value.groups
  const tagged =
    vm === undefined
      ? []
      : vmGroupNames(vm.tags, publishedDocument.value).filter(name => {
          const networks = groupNetworks(groups[name])

          return networks.length === 0 || (netTags !== undefined && isOnNetworks(netTags, networks))
        })

  return [...groupsOfIp(address), ...tagged]
}

// the published policy's allow rule that now lets the flow through, if any
function coveringRuleId(entry: VdfMonitorEntry) {
  const policy = publishedDocument.value.policies.find(candidate => candidate.name === entry.policy)

  return policy === undefined ? undefined : coveringRule(policy, entry, groupsOf)?.id
}

const vmById = computed(() => new Map<string, FrontXoVm>(vms.value.map(vm => [vm.id, vm])))

// "allow this": the rule drawer, prefilled, in the policy's place (before
// the rule that would drop)
function allowRoute(entry: VdfMonitorEntry): RouteLocationRaw | undefined {
  const peer = entry.egress ? entry.dst : entry.src

  if (peer === undefined || peer === MONITOR_OTHER || !['tcp', 'udp', 'icmp'].includes(entry.proto)) {
    return undefined
  }

  // an outbound rule to the destination, or a rule from the source
  const query = {
    newRule: '1',
    [entry.egress ? 'to' : 'from']: sourceOf(peer, entry.policy),
    proto: entry.proto,
    port: entry.port ? String(entry.port) : undefined,
    before: entry.rule ? String(entry.rule) : undefined,
  }

  // the global firewall names its groups and policies without the prefix
  return isGlobalName(entry.policy)
    ? {
        name: '/(site)/firewall/policies',
        query: {
          ...query,
          policy: displayName(entry.policy),
          [entry.egress ? 'to' : 'from']: displayName(sourceOf(peer, entry.policy)),
        },
      }
    : { name: '/pool/[id]/firewall/policies', params: { id: pool.id }, query: { policy: entry.policy, ...query } }
}

// the same flow, traced (as from the rule log): the source and destination
// VMs of this pool (the interface of one with several, vdf#36), else the
// address; a monitored drop is what the trace calls allowed
function traceRoute(entry: VdfMonitorEntry): RouteLocationRaw | undefined {
  const peer = entry.egress ? entry.dst : entry.src

  if (peer === undefined || peer === MONITOR_OTHER || !['tcp', 'udp', 'icmp'].includes(entry.proto)) {
    return undefined
  }

  const ifaceOf = (vm: FrontXoVm | undefined, match: (iface: ReturnType<typeof interfacesOf>[number]) => boolean) =>
    vm === undefined ? undefined : interfacesOf(vm).find(iface => iface.ips.length > 0 && match(iface))?.ips[0]

  const vm = vmById.value.get(entry.vm)
  const peerVm = vmByIp.value.get(peer)
  const isPoolVm = peerVm !== undefined && peerVm.$pool === pool.id
  const own = { id: entry.vm, ip: undefined, iface: ifaceOf(vm, iface => iface.vif.id === entry.vif) }
  const other = isPoolVm
    ? { id: peerVm.id, ip: undefined, iface: ifaceOf(peerVm, iface => iface.ips.includes(peer)) }
    : { id: 'external', ip: peer, iface: undefined }
  const [from, to] = entry.egress ? [own, other] : [other, own]

  return {
    name: '/pool/[id]/firewall/trace',
    params: { id: pool.id },
    query: {
      from: from.id,
      fromip: from.ip,
      fromiface: from.iface,
      to: to.id,
      toip: to.ip,
      toiface: to.iface,
      proto: entry.proto,
      port: entry.proto !== 'icmp' && entry.port ? String(entry.port) : undefined,
      run: '1',
    },
  }
}

// every filter but the expected flows
const filteredRows = computed<Row[]>(() => {
  const term = search.value.trim().toLocaleLowerCase()
  const names = new Set(shownPolicies.value.map(policy => policy.name))
  const entries = showExpired.value ? (monitor.value?.entries ?? []) : liveEntries(monitor.value?.entries ?? [])

  return entries
    .filter(entry => selectedPolicy.value === ALL || names.has(entry.policy))
    .filter(
      entry =>
        term === '' ||
        [
          entry.src,
          entry.dst,
          entry.vmName,
          entry.policy,
          String(entry.port ?? ''),
          vmByIp.value.get(entry.src)?.name_label,
          entry.dst === undefined ? undefined : vmByIp.value.get(entry.dst)?.name_label,
        ].some(value => value?.toLocaleLowerCase().includes(term))
    )
    .map(entry => ({
      key: monitorFlowKey(entry),
      entry,
      allow: allowRoute(entry),
      trace: traceRoute(entry),
      expected: isExpected(entry),
      coveredBy: coveringRuleId(entry),
    }))
})

const expectedCount = computed(() => filteredRows.value.filter(row => row.expected).length)

// flows a published rule now allows: hidden unless asked
const showCovered = ref(false)

const coveredCount = computed(() => filteredRows.value.filter(row => row.coveredBy !== undefined).length)

const rows = computed(() =>
  filteredRows.value.filter(
    row => (showExpected.value || !row.expected) && (showCovered.value || row.coveredBy === undefined)
  )
)

const { pageRecords: pageRows, paginationBindings } = usePagination('vdf-monitor', rows)

const state = useTableState({
  busy: () => !isMonitorReady.value && !hasMonitorError.value,
  error: () => (!isMonitorReady.value && hasMonitorError.value ? t('firewall:monitor:error') : false),
  empty: () => {
    if ((monitor.value?.entries.length ?? 0) === 0) {
      return {
        type: 'no-data',
        message: shadows.value.length > 0 ? t('firewall:monitor:empty:shadowed') : t('firewall:monitor:empty'),
      }
    }

    if (rows.value.length === 0 && coveredCount.value > 0 && !showCovered.value) {
      return {
        type: 'no-result',
        message: t('firewall:monitor:all-covered', { n: coveredCount.value }, coveredCount.value),
      }
    }

    if (rows.value.length === 0 && expectedCount.value > 0 && expectedCount.value === filteredRows.value.length) {
      return {
        type: 'no-result',
        message: t('firewall:monitor:all-expected', { n: expectedCount.value }, expectedCount.value),
      }
    }

    return rows.value.length === 0 ? { type: 'no-result' } : false
  },
})

function decidedBy(entry: VdfMonitorEntry) {
  if (!entry.rule) {
    return t('firewall:monitor:by-default')
  }

  return entry.pass
    ? t('firewall:monitor:by-pass', { id: entry.rule })
    : t('firewall:monitor:by-rule', { id: entry.rule })
}

// the VM, and which of its interfaces when it has several (vdf#36)
function vmEndpoint(entry: VdfMonitorEntry) {
  const vm = vmById.value.get(entry.vm)

  return h(VdfEndpoint, { scopeId: pool.id, ip: '', vm, name: entry.vmName, iface: vifLabel(vm, entry.vif) })
}

// past a rule's quota, the other sources (egress: destinations) are counted together
function addressEndpoint(address: string, others: 'sources' | 'destinations') {
  return address === MONITOR_OTHER
    ? h('span', { class: 'secondary' }, t(`firewall:monitor:other-${others}`))
    : h(VdfEndpoint, {
        scopeId: pool.id,
        ip: address,
        vm: vmByIp.value.get(address),
        groups: vmByIp.value.get(address) === undefined ? groupsOfIp(address) : [],
        iface: interfaceLabel(vmByIp.value.get(address), address),
      })
}

function rowButton(icon: IconName, label: string, onClick: () => void) {
  return withDirectives(h(UiButtonIcon, { icon, size: 'small', accent: 'brand', 'aria-label': label, onClick }), [
    [vTooltip, label],
  ])
}

// a button that says what it does: allowing and marking expected are
// opposite answers, never two look-alike icons
function rowTextButton(icon: IconName, label: string, tooltip: string, onClick: () => void) {
  return withDirectives(
    h(UiButton, { variant: 'tertiary', accent: 'brand', size: 'small', leftIcon: icon, onClick }, () => label),
    [[vTooltip, tooltip]]
  )
}

// trace it
function rowButtons(row: Row) {
  return row.trace === undefined
    ? null
    : rowButton('fa:route', t('firewall:monitor:trace'), () => router.push(row.trace!))
}

// allow it, or mark it expected (and back): under what would drop it, where
// a table at a laptop's width has room for their labels
function answerButtons(row: Row) {
  return h('span', { class: 'row-actions' }, [
    row.allow === undefined || row.expected || row.coveredBy !== undefined
      ? null
      : rowTextButton('fa:plus', t('firewall:monitor:action:allow'), t('firewall:monitor:allow-this'), () =>
          router.push(row.allow!)
        ),
    row.coveredBy !== undefined
      ? null
      : row.expected
        ? rowTextButton(
            'fa:rotate-left',
            t('firewall:monitor:action:not-expected'),
            t('firewall:monitor:not-expected'),
            () => setExpected(row.entry, false)
          )
        : rowTextButton(
            'fa:eye-slash',
            t('firewall:monitor:action:expected'),
            t('firewall:monitor:expected:mark'),
            () => setExpected(row.entry, true)
          ),
  ])
}

const useMonitorColumns = defineColumns(() => ({
  // the policy and what in it would drop: one column (a laptop's width)
  policy: useLiteralColumn({ headerLabel: () => t('firewall:monitor:would-drop') }),
  source: useLiteralColumn({ headerLabel: () => t('firewall:source') }),
  destination: useLiteralColumn({ headerLabel: () => t('firewall:destination') }),
  service: useLiteralColumn({ headerLabel: () => t('firewall:service') }),
  seen: useLiteralColumn({ headerLabel: () => t('firewall:monitor:last-seen') }),
  // its buttons say it (tooltip, label): a narrow column
  actions: useLiteralColumn({ headerLabel: () => '' }),
}))

const { HeadCells, BodyCells } = useMonitorColumns({
  body: (row: Row) => ({
    policy: r =>
      r(
        h('span', { class: 'policy' }, [
          h('span', displayName(row.entry.policy)),
          h(
            'span',
            { class: 'secondary typo-body-regular-small' },
            row.entry.expired ? `${decidedBy(row.entry)} · ${t('firewall:monitor:expired')}` : decidedBy(row.entry)
          ),
          row.expected
            ? h(UiTag, { accent: 'neutral', variant: 'secondary' }, () => t('firewall:monitor:expected'))
            : null,
          row.coveredBy === undefined
            ? null
            : h(UiTag, { accent: 'success', variant: 'secondary' }, () =>
                t('firewall:monitor:now-allowed', { id: globalRuleId(row.coveredBy!) })
              ),
          answerButtons(row),
        ])
      ),
    // egress: the VM is the source, the address the destination
    source: r => r(row.entry.egress ? vmEndpoint(row.entry) : addressEndpoint(row.entry.src, 'sources')),
    destination: r =>
      r(row.entry.egress ? addressEndpoint(row.entry.dst ?? '', 'destinations') : vmEndpoint(row.entry)),
    service: r => r(h(VdfService, { proto: row.entry.proto, port: row.entry.port ? String(row.entry.port) : '' })),
    seen: r =>
      r(
        h('span', { class: 'seen' }, [
          h(VtsRelativeTime, { date: row.entry.last }),
          h('span', { class: 'secondary typo-body-regular-small' }, t('firewall:monitor:seen', { n: row.entry.count })),
        ])
      ),
    actions: r => r(rowButtons(row)),
  }),
})
</script>

<style lang="postcss" scoped>
.vdf-monitor-report {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 1.6rem;
  }

  .policy-filter {
    min-width: 24rem;
  }

  .search {
    flex: 1;
    min-width: 20rem;
  }

  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    padding: 1.2rem 1.6rem;
    border: 0.1rem solid var(--color-info-item-base);
    border-radius: 0.8rem;
    background-color: var(--color-info-background-selected);
  }

  .shadows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-inline-start: 1.6rem;
    margin: 0;
  }

  .suggestions-title,
  .suggestion {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem 1.6rem;
  }

  .suggestion-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  :deep(.policy),
  :deep(.seen) {
    display: flex;
    flex-direction: column;
  }

  :deep(.policy .ui-tag) {
    align-self: flex-start;
  }

  :deep(.row-actions) {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-inline-start: -0.8rem;
  }
}
</style>
