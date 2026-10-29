<template>
  <VdfContentModal :accent @confirm="confirm()" @dismiss="emit('cancel')">
    <template #title>
      {{ isGlobalScope(shown.scopeId) ? t('firewall:global:publish:title') : t('firewall:publish:title') }}
    </template>
    <template #content>
      <div class="vdf-publish-modal">
        <UiAlert v-if="shown.isOutdated" accent="warning">
          {{ t('firewall:publish:outdated') }}
          <template #description>
            <UiButton variant="secondary" accent="warning" size="small" @click="emit('rebase')">
              {{ t('firewall:draft:rebase') }}
            </UiButton>
          </template>
        </UiAlert>

        <section class="section">
          <h3 class="typo-body-bold">
            {{ t('firewall:draft:changes', { n: shown.changeCount }, shown.changeCount) }}
          </h3>
          <VdfChangeList :details :member-count :is-global="isGlobalScope(shown.scopeId)" />
        </section>

        <!-- vdf#47: a global publish, the pools and VMs each policy reaches -->
        <section v-if="isGlobalScope(shown.scopeId) && shown.document.policies.length > 0" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:global:reach') }}</h3>
          <p class="typo-body-regular-small secondary">{{ t('firewall:global:reach:info') }}</p>
          <UiInfo v-for="policy of shown.document.policies" :key="policy.name" accent="info" wrap>
            {{ reachText(policy.name) }}
          </UiInfo>
        </section>

        <section v-if="enforced.length > 0" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:enforcing') }}</h3>
          <template v-for="item of enforced" :key="item.policy">
            <UiInfo :accent="item.flows > 0 ? 'warning' : 'success'" wrap>{{ item.text }}</UiInfo>
            <UiInfo v-if="item.expectedText !== undefined" accent="muted" wrap>{{ item.expectedText }}</UiInfo>
            <!-- vdf#86: what it would drop once the enforced policies of its tier stop applying -->
            <UiInfo v-for="alone of item.alone" :key="alone.key" accent="info" wrap>{{ alone.text }}</UiInfo>
          </template>
        </section>

        <!-- every warning in one place, dangers first; a global policy's links to where it's edited -->
        <section v-if="allWarnings.length > 0" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:warnings') }}</h3>
          <div v-for="warning of allWarnings" :key="warning.key" class="warning">
            <UiInfo v-tooltip="warning.tooltip ?? false" :accent="warning.accent" wrap>
              {{
                warning.pool === undefined
                  ? warning.text
                  : t('firewall:publish:in-pool', { pool: warning.pool, text: warning.text })
              }}
            </UiInfo>
            <UiLink
              v-if="warning.globalPolicy !== undefined"
              size="small"
              icon="fa:globe"
              :to="vdfGlobalRoute('policies', { policy: warning.globalPolicy })"
            >
              {{ t('firewall:global:edit-xo-wide') }}
            </UiLink>
          </div>
        </section>

        <!-- one line per pool: valid, rejected, checking -->
        <section v-if="!shown.isOutdated" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:validation') }}</h3>
          <UiInfo v-if="checkResult === undefined && checkError === undefined" accent="muted">
            <span class="checking"><VtsIcon name="fa:spinner" size="small" />{{ t('firewall:publish:checking') }}</span>
          </UiInfo>
          <UiInfo v-else-if="checkError !== undefined" accent="danger" wrap>
            {{ t('firewall:publish:validation-failed', { error: checkError }) }}
          </UiInfo>
          <template v-else-if="checkResult?.pools !== undefined">
            <UiInfo v-if="checkResult.error" accent="danger" wrap>
              {{ t('firewall:publish:validation-failed', { error: checkResult.error }) }}
            </UiInfo>
            <div v-for="pool of checkResult.pools" :key="pool.id" class="pool-result">
              <span class="typo-body-bold-small pool-name">{{ pool.name }}</span>
              <UiInfo v-if="pool.skipped" accent="muted" wrap>{{ t('firewall:global:check:out-of-scope') }}</UiInfo>
              <UiInfo v-else-if="pool.unreachable" accent="warning" wrap>
                {{ t('firewall:global:check:unreachable') }}
              </UiInfo>
              <UiInfo v-else-if="pool.otherXo" accent="warning" wrap>
                {{ t('firewall:global:check:other-xo', { xo: pool.owner }) }}
              </UiInfo>
              <UiInfo
                v-else-if="pool.ok"
                v-tooltip="t('firewall:publish:valid:details', { version: pool.version, keys: pool.keys?.join(', ') })"
                accent="success"
                wrap
              >
                {{ pool.inScope ? t('firewall:publish:valid') : t('firewall:global:check:removed') }}
              </UiInfo>
              <!-- vdf#2: hosts whose agent can't enforce the pool's document as written -->
              <template v-else-if="(pool.lacking?.length ?? 0) > 0">
                <UiInfo v-tooltip="pool.error ?? false" accent="danger" wrap>
                  {{ t('firewall:publish:lacking') }}
                </UiInfo>
                <UiInfo v-for="host of pool.lacking" :key="host.host" accent="danger" wrap>
                  {{ lackingText(host) }}
                </UiInfo>
              </template>
              <UiInfo v-else accent="danger" wrap>
                {{ t('firewall:publish:validation-failed', { error: pool.error }) }}
              </UiInfo>
            </div>
          </template>
          <template v-else-if="checkResult !== undefined">
            <!-- vdf#2: hosts whose agent can't enforce this document as written -->
            <template v-if="checkResult.ok && lackingPools.length > 0">
              <UiInfo v-tooltip="checkResult.refused ?? false" accent="danger" wrap>
                {{ t('firewall:publish:lacking') }}
              </UiInfo>
              <UiInfo v-for="host of checkResult.lacking" :key="host.host" accent="danger" wrap>
                {{ lackingText(host) }}
              </UiInfo>
            </template>
            <UiInfo
              v-else-if="checkResult.ok"
              v-tooltip="
                t('firewall:publish:valid:details', {
                  version: checkResult.version,
                  keys: checkResult.keys?.join(', '),
                })
              "
              accent="success"
              wrap
            >
              {{ t('firewall:publish:valid') }}
            </UiInfo>
            <UiInfo v-else accent="danger" wrap>
              {{ t('firewall:publish:validation-failed', { error: checkResult.error }) }}
            </UiInfo>
          </template>
        </section>

        <!-- what the published document already warned about: once, folded -->
        <details v-if="unchanged.length > 0" class="unchanged">
          <summary class="typo-body-regular-small secondary">
            {{ t('firewall:publish:unchanged-warnings', { n: unchanged.length }, unchanged.length) }}
          </summary>
          <div class="unchanged-list">
            <UiInfo v-for="note of unchanged" :key="note.key" accent="muted" wrap>{{ note.text }}</UiInfo>
          </div>
        </details>

        <UiAlert v-if="shown.publishError" accent="danger">{{ shown.publishError }}</UiAlert>
        <UiAlert v-else-if="!shown.isOutdated" accent="info">
          {{
            t(
              `${isGlobalScope(shown.scopeId) ? 'firewall:global:publish:effect' : 'firewall:publish:effect'}${isMonitorOnly ? ':monitor' : ''}`
            )
          }}
        </UiAlert>
        <UiInfo v-if="isRejected" accent="danger" wrap>{{ t('firewall:publish:fix-errors') }}</UiInfo>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <!-- vdf#2: past hosts lacking what the document needs, once confirmed -->
      <UiButton v-if="canPublishAnyway" variant="secondary" accent="danger" size="medium" @click="publishAnyway()">
        {{ t('firewall:publish:anyway') }}
      </UiButton>
      <VtsOverlayConfirmButton :disabled="!canPublish">{{ t('firewall:publish') }}</VtsOverlayConfirmButton>
    </template>
  </VdfContentModal>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VdfChangeList from '@/modules/vdf/components/history/VdfChangeList.vue'
import VdfContentModal from '@/modules/vdf/components/VdfContentModal.vue'
import { useVdfGlobalReach } from '@/modules/vdf/composables/vdf-global-reach.composable.ts'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfMonitorExpected } from '@/modules/vdf/composables/vdf-monitor-expected.composable.ts'
import { useVdfMonitorShadows } from '@/modules/vdf/composables/vdf-monitor-shadows.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { useVdfTrafficRules } from '@/modules/vdf/composables/vdf-traffic-rules.composable.ts'
import { checkVdfDocument, fetchVdfMonitor, fetchVdfOpenConnections } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import type {
  VdfCheckResult,
  VdfDefaultAction,
  VdfDocument,
  VdfGlobalDocument,
  VdfLackingHost,
  VdfMonitorEntry,
  VdfScopeId,
} from '@/modules/vdf/types.ts'
import { parseAgentWarning } from '@/modules/vdf/utils/vdf-agent-warning.util.ts'
import {
  changeDetails,
  hostWarnings,
  isMonitorOnlyChange,
  overriddenDefaults,
  publishWarnings,
} from '@/modules/vdf/utils/vdf-change.util.ts'
import {
  composeWithGlobal,
  displayName,
  inGlobalScope,
  isGlobalName,
  isGlobalScope,
  ruleNumber,
  vdfGlobalRoute,
} from '@/modules/vdf/utils/vdf-global.util.ts'
import {
  aloneSince,
  coveredBy,
  enforcedPolicies,
  isMonitored,
  seenSince,
} from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupNetworks, isOnNetworks } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { reportedTierValue, vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { shadowKey, type VdfMonitorShadow } from '@/modules/vdf/utils/vdf-shadow.util.ts'
import { agentGaps, parseHostStatus } from '@/modules/vdf/utils/vdf-status.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlayTrigger } from '@core/packages/overlay/use-overlay-trigger.ts'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  scopeId: VdfScopeId
  document: VdfDocument
  // the published document the draft started from
  baseDocument: VdfDocument
  changeCount: number
  // someone published since: the draft must be rebased first
  isOutdated: boolean
  // VMs per group; undefined while VMs load
  memberCounts?: Record<string, number>
  publishError?: string
}>()

const emit = defineEmits<{
  // forcePools: "Publish anyway", the pools to publish to past hosts
  // whose agent lacks what the document needs (vdf#2)
  confirm: [forcePools?: string[]]
  cancel: []
  rebase: []
}>()

const { t, n, locale } = useI18n()

// A publish clears the draft before the modal has faded out: while the
// overlay handles Publish (or Cancel), the modal keeps showing what it had,
// rather than an empty draft. A failed publish leaves it open, live again.
const { isDisabled: isHandling } = useOverlayTrigger()

const frozen = shallowRef<typeof props>()

watch(isHandling, handling => (frozen.value = handling ? { ...props } : undefined), { flush: 'sync' })

const shown = computed(() => frozen.value ?? props)

// the draft's own changes, never what others published meanwhile
const details = computed(() => changeDetails(shown.value.baseDocument, shown.value.document))

// only policies in monitor mode change: nothing enforced changes, no
// connection is cut
const isMonitorOnly = computed(() =>
  isMonitorOnlyChange(shown.value.baseDocument, shown.value.document, { isGlobal: isGlobalScope(shown.value.scopeId) })
)

const memberCount = (group: string) => shown.value.memberCounts?.[group]

const tierLabel = useVdfTierLabel()

const { vms } = useXoVmCollection()

// a default as the policies board shows it: pass goes to the next tier
const defaultLabel = (action: VdfDefaultAction) =>
  action === 'pass' ? t('firewall:action:next-tier') : t(`firewall:action:${action}`)

const { netTagsOfAddress, interfacesOf } = useVdfInterfaces()

// a pool policy's default that a global policy's decides for (vdf#27), on
// a pool's document with its global part, for the pool's VMs: the groups of
// each of their interfaces (a group scoped to networks only holds those on
// them)
function overriddenIn(document: VdfDocument, poolId: string) {
  const interfaceGroups = vms.value
    .filter(vm => vm.$pool === poolId)
    .map(vm => {
      const groups = vmGroupNames(vm.tags, document)

      return interfacesOf(vm).map(iface =>
        groups.filter(name => isOnNetworks(iface.netTags, groupNetworks(document.groups[name])))
      )
    })
  const sharedVms = (group: string, other: string) =>
    interfaceGroups.filter(ifaces => ifaces.some(groups => groups.includes(group) && groups.includes(other))).length

  return overriddenDefaults(document, sharedVms).map(item => ({
    key: `overridden:${item.policy}:${item.global}:${item.egress}`,
    // the global policy whose default decides: edited in the global firewall
    policy: item.global,
    text: t(
      item.egress
        ? 'firewall:publish:warning:overridden-egress-default'
        : 'firewall:publish:warning:overridden-default',
      {
        policy: displayName(item.policy),
        global: displayName(item.global),
        tier: tierLabel(item.tier),
        own: defaultLabel(item.own),
        theirs: defaultLabel(item.theirs),
        n: n(item.vms),
      },
      item.vms
    ),
  }))
}

// a pool's publish: its draft, with the pool's global part
const overriddenAll = computed(() =>
  isGlobalScope(shown.value.scopeId)
    ? { fresh: [], known: [] }
    : splitKnown(
        overriddenIn(shown.value.document, shown.value.scopeId),
        overriddenIn(shown.value.baseDocument, shown.value.scopeId)
      )
)

const overridden = computed(() => overriddenAll.value.fresh)

// A GLOBAL PUBLISH: where each policy applies, in the pools of the draft's
// scope that get this configuration (vdf#47)

const { globalStatus } = useVdfGlobal()

const reachPools = computed(() =>
  isGlobalScope(shown.value.scopeId)
    ? (globalStatus.value?.pools ?? []).filter(
        pool =>
          inGlobalScope((shown.value.document as VdfGlobalDocument).scope, pool.id) &&
          pool.state !== 'other-xo' &&
          pool.seenAt === undefined
      )
    : []
)

const { reachText } = useVdfGlobalReach(() => shown.value.document, reachPools)

// VMs the draft brings under an enforced policy that have XO's Traffic
// Rules (vdf#40): those keep deciding first for what they match

const { rulesOfVm } = useVdfTrafficRules()

const trafficRuleWarnings = computed(() => {
  const { scopeId, document, baseDocument } = shown.value
  const poolIds = new Set(isGlobalScope(scopeId) ? reachPools.value.map(pool => pool.id) : [scopeId])
  // by tags, and for a group scoped to networks (vdf#36) an interface on them
  const protects = (doc: VdfDocument) => {
    const appliedTo = new Set(enforcedPolicies(doc).map(policy => policy.appliedTo))

    return (vm: FrontXoVm) =>
      vmGroupNames(vm.tags, doc).some(name => {
        const networks = groupNetworks(doc.groups[name])

        return (
          appliedTo.has(name) &&
          (networks.length === 0 || interfacesOf(vm).some(iface => isOnNetworks(iface.netTags, networks)))
        )
      })
  }
  const now = protects(document)
  const before = protects(baseDocument)

  return vms.value
    .filter(vm => poolIds.has(vm.$pool) && now(vm) && !before(vm))
    .flatMap(vm => {
      const count = rulesOfVm(vm).length

      return count === 0
        ? []
        : [
            {
              key: `traffic-rules:${vm.id}`,
              text: t('firewall:publish:warning:traffic-rules', { vm: vm.name_label, n: n(count) }, count),
            },
          ]
    })
})

// open connections per rule, for the rules the draft removes (one sample
// of the pool's live stats)
const openConnections = ref<Map<number, number>>()

const warnings = computed<(Note & { policy?: string })[]>(() => [
  ...publishWarnings(details.value, {
    memberCount,
    openConnections: id => openConnections.value?.get(id),
  }).map(warning => {
    const policy = displayName(warning.policy)

    if (warning.type === 'open-connections') {
      return {
        key: `${warning.type}:${warning.rule}`,
        text: t(
          'firewall:publish:warning:open-connections',
          {
            rule: ruleNumber(warning.rule, { global: isGlobalScope(shown.value.scopeId) }),
            policy,
            n: n(warning.count),
          },
          warning.count
        ),
      }
    }

    return {
      key: `${warning.type}:${warning.policy}`,
      policy: warning.policy,
      text: t(`firewall:publish:warning:${warning.type}`, { policy, group: displayName(warning.group) }),
    }
  }),
  ...overridden.value,
  ...trafficRuleWarnings.value,
])

// policies the draft switches from monitor mode to enforce (vdf#13): what
// they would have dropped over the last day, from the pool's report
const enforcing = computed(() =>
  shown.value.document.policies
    .filter(policy => !isMonitored(policy))
    .filter(policy => shown.value.baseDocument.policies.some(base => base.name === policy.name && isMonitored(base)))
    .map(policy => policy.name)
)

const monitorEntries = ref<VdfMonitorEntry[]>()

const DAY = 24 * 60 * 60 * 1000

// who a source address is, to tell the flows the draft now allows
const { vmByIp, groupsOfIp } = useVdfIpNames(() => shown.value.document)

// a group scoped to networks (vdf#36) only holds the address on them
function groupsOf(address: string) {
  const vm = vmByIp.value.get(address)
  const netTags = vm === undefined ? undefined : netTagsOfAddress(vm, address)
  const tagged =
    vm === undefined
      ? []
      : vmGroupNames(vm.tags, shown.value.document).filter(name => {
          const networks = groupNetworks(shown.value.document.groups[name])

          return networks.length === 0 || (netTags !== undefined && isOnNetworks(netTags, networks))
        })

  return [...groupsOfIp(address), ...tagged]
}

// flows marked expected in the Monitor report (vdf#13): wanted drops,
// told apart
const { isExpected } = useVdfMonitorExpected(() => shown.value.scopeId)

// the flows of the last day the draft's policy would still drop
const enforced = computed(() =>
  monitorEntries.value === undefined
    ? []
    : enforcing.value.map(name => {
        const draftPolicy = shown.value.document.policies.find(policy => policy.name === name)
        const dropped = seenSince(monitorEntries.value!, name, Date.now() - DAY).filter(
          entry => draftPolicy === undefined || !coveredBy(draftPolicy, entry, groupsOf)
        )
        const flows = dropped.filter(entry => !isExpected(entry)).length
        const expected = dropped.length - flows
        const policy = displayName(name)
        // vdf#86: apart, what it would drop once the enforced policies of
        // its tier no longer apply (nothing enforcing breaks now)
        const alone = aloneSince(
          monitorEntries.value!,
          name,
          Date.now() - DAY,
          entry => !isExpected(entry) && (draftPolicy === undefined || !coveredBy(draftPolicy, entry, groupsOf)),
          // per shadowed tier, in tier order
          { rank: reportedTierValue }
        ).map(({ shadowedBy, shadowedTier, earlier, count }) => ({
          key: `${shadowedTier ?? ''}|${shadowedBy.join('|')}`,
          // a later tier's policy, reached once an earlier tier's no longer decide
          text: t(
            earlier ? 'firewall:publish:enforcing:alone:earlier' : 'firewall:publish:enforcing:alone',
            {
              policy,
              by: new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(shadowedBy.map(displayName)),
              tier: shadowedTier === undefined ? '' : tierLabel(reportedTierValue(shadowedTier)),
              n: n(count),
            },
            count
          ),
        }))

        return {
          policy: name,
          flows,
          text:
            flows > 0
              ? t('firewall:publish:enforcing:flows', { policy, n: n(flows) }, flows)
              : expected > 0
                ? t('firewall:publish:enforcing:only-expected', { policy, n: n(expected) }, expected)
                : t('firewall:publish:enforcing:clean', { policy }),
          expectedText:
            flows > 0 && expected > 0
              ? t('firewall:publish:enforcing:expected', { n: n(expected) }, expected)
              : undefined,
          alone,
        }
      })
)

// what the pool master's agent makes of the draft, before anything is written
const checkResult = ref<VdfCheckResult>()

const checkError = ref<string>()

// a global publish: each pool in scope, its own part as the check found it
// with the draft's global configuration
const overriddenPerPoolAll = computed(() =>
  isGlobalScope(shown.value.scopeId)
    ? (checkResult.value?.pools ?? [])
        .filter(pool => pool.own !== undefined)
        .map(pool => ({
          pool,
          ...splitKnown(
            overriddenIn(composeWithGlobal(pool.own!, shown.value.document), pool.id),
            overriddenIn(composeWithGlobal(pool.own!, shown.value.baseDocument), pool.id)
          ),
        }))
    : []
)

const overriddenPerPool = computed<Record<string, Note[]>>(() =>
  Object.fromEntries(overriddenPerPoolAll.value.map(item => [item.pool.id, item.fresh]))
)

// MONITORED POLICIES that can't see some of their VMs (vdf#86): an enforced
// policy of their tier (or an earlier tier deciding everything) decides
// first there, so their report stays empty for them. Those the published
// document already has are kept, muted, after the new ones.

const { shadowsIn, shadowText } = useVdfMonitorShadows()

const sameShadow = (shadow: VdfMonitorShadow) =>
  `${shadowKey(shadow)}|${shadow.vms
    .map(vm => vm.id)
    .sort()
    .join(',')}`

function shadowsOf(document: VdfDocument, base: VdfDocument, poolId: string, pool?: string) {
  const poolVms = vms.value.filter(vm => vm.$pool === poolId).map(vm => ({ vm }))
  const before = new Set(shadowsIn(base, poolVms).map(sameShadow))

  return shadowsIn(document, poolVms).map(shadow => ({
    key: `${poolId}|${sameShadow(shadow)}`,
    pool,
    text: shadowText(shadow),
    isNew: !before.has(sameShadow(shadow)),
  }))
}

const shadowNotes = computed(() => {
  const { scopeId, document, baseDocument } = shown.value
  const notes = isGlobalScope(scopeId)
    ? (checkResult.value?.pools ?? [])
        .filter(pool => pool.own !== undefined && pool.inScope)
        .flatMap(pool =>
          shadowsOf(
            composeWithGlobal(pool.own!, document),
            composeWithGlobal(pool.own!, baseDocument),
            pool.id,
            pool.name
          )
        )
    : shadowsOf(document, baseDocument, scopeId)

  return [...notes.filter(note => note.isNew), ...notes.filter(note => !note.isNew)]
})

const newShadowNotes = computed(() => shadowNotes.value.filter(note => note.isNew))

// HOSTS a publish doesn't reach (vdf#38): no agent, or one stopped or stuck,
// for the pool, or each pool the global configuration is checked on

const { hosts: allHosts } = useXoHostCollection()

const hostNotes = computed(() => {
  const poolIds = isGlobalScope(shown.value.scopeId)
    ? (checkResult.value?.pools ?? []).map(pool => pool.id)
    : [shown.value.scopeId]

  return Object.fromEntries(
    poolIds.map(poolId => {
      const gaps = agentGaps(
        allHosts.value
          .filter(host => host.$pool === poolId)
          .map(host => ({
            name: host.name_label,
            status: parseHostStatus(host.otherConfig),
            running: host.power_state === 'Running',
          }))
      )

      return [
        poolId,
        hostWarnings(gaps).map(warning => ({
          key: warning.type,
          text: t(`firewall:publish:${warning.type}`, { hosts: warning.hosts.join(', ') }, warning.hosts.length),
        })),
      ]
    })
  )
})

// EVERY WARNING, in one list: the draft's own, the monitored policies it
// leaves blind (vdf#86), the agents' (pool by pool for a global publish),
// the hosts it doesn't reach (danger: their VMs get nothing), the defaults
// a global policy overrides. Dangers first. In a pool, one about a global
// policy links to the global firewall: the pool can't edit it.
type Warning = {
  key: string
  text: string
  accent: 'danger' | 'warning'
  pool?: string
  tooltip?: string
  globalPolicy?: string
}

const inPool = computed(() => !isGlobalScope(shown.value.scopeId))

const globalOf = (policy: string | undefined) =>
  inPool.value && policy !== undefined && isGlobalName(policy) ? policy : undefined

const poolNames = computed(() => new Map((checkResult.value?.pools ?? []).map(pool => [pool.id, pool.name] as const)))

const allWarnings = computed<Warning[]>(() => {
  const agent =
    checkResult.value?.pools !== undefined
      ? checkResult.value.pools.flatMap(pool =>
          newAgentWarnings(pool.warnings, pool.id).map(warning => ({
            key: `agent:${pool.id}:${warning.raw}`,
            text: warning.text,
            tooltip: warning.tooltip,
            pool: pool.name,
            accent: 'warning' as const,
            globalPolicy: globalOf(warning.policy),
          }))
        )
      : newAgentWarnings(checkResult.value?.warnings).map(warning => ({
          key: `agent:${warning.raw}`,
          text: warning.text,
          tooltip: warning.tooltip,
          accent: 'warning' as const,
          globalPolicy: globalOf(warning.policy),
        }))
  const hosts = Object.entries(hostNotes.value).flatMap(([poolId, notes]) =>
    (checkResult.value?.pools ?? []).some(pool => pool.id === poolId && (pool.skipped || pool.unreachable))
      ? []
      : notes.map(note => ({
          key: `hosts:${poolId}:${note.key}`,
          text: note.text,
          pool: inPool.value ? undefined : poolNames.value.get(poolId),
          accent: 'danger' as const,
        }))
  )
  const all: Warning[] = [
    ...hosts,
    ...newShadowNotes.value.map(note => ({
      key: note.key,
      text: note.text,
      pool: note.pool,
      accent: 'warning' as const,
    })),
    ...warnings.value.map(({ policy, ...warning }) => ({
      ...warning,
      accent: 'warning' as const,
      globalPolicy: globalOf(policy),
    })),
    ...agent,
    ...Object.entries(overriddenPerPool.value).flatMap(([poolId, notes]) =>
      notes.map(note => ({
        key: `${poolId}:${note.key}`,
        text: note.text,
        pool: poolNames.value.get(poolId),
        accent: 'warning' as const,
      }))
    ),
  ]

  return [...all.filter(warning => warning.accent === 'danger'), ...all.filter(warning => warning.accent !== 'danger')]
})

const isRisky = computed(
  () =>
    warnings.value.length > 0 ||
    enforced.value.some(item => item.flows > 0) ||
    newShadowNotes.value.length > 0 ||
    Object.values(hostNotes.value).some(notes => notes.length > 0) ||
    Object.values(overriddenPerPool.value).some(notes => notes.length > 0) ||
    details.value.groups.some(change => change.type === 'removed') ||
    details.value.policies.some(
      change => change.type === 'removed' || change.rules.some(rule => rule.type === 'removed')
    )
)

// HOSTS WHOSE AGENT CAN'T ENFORCE THE DOCUMENT AS WRITTEN (vdf#2): the
// agent's check names them and what they lack (its version logic, not
// XO's). Publishing is refused, pool by pool, unless forced: "Publish
// anyway", confirmed.
const lackingPools = computed(() => {
  const result = checkResult.value

  if (result === undefined) {
    return []
  }

  if (result.pools !== undefined) {
    return result.pools
      .filter(pool => !pool.ok && (pool.lacking?.length ?? 0) > 0)
      .map(pool => ({ id: pool.id, lacking: pool.lacking! }))
  }

  return result.ok && (result.lacking?.length ?? 0) > 0
    ? [{ id: shown.value.scopeId as string, lacking: result.lacking! }]
    : []
})

// the capabilities as the agent names them, in the admin's words
const CAPABILITY_KEYS: Record<string, string> = {
  tiers: 'tiers',
  'tier names': 'tier-names',
  'monitor mode': 'monitor',
  'port ranges': 'port-ranges',
  egress: 'egress',
  'per-network groups': 'networks',
  'groups on networks alone': 'networks-only',
}

function capabilityLabel(name: string) {
  const format = /^format (\d+)$/.exec(name)

  if (format !== null) {
    return t('firewall:capability:format', { version: format[1] })
  }

  return CAPABILITY_KEYS[name] === undefined ? name : t(`firewall:capability:${CAPABILITY_KEYS[name]}`)
}

function lackingText(host: VdfLackingHost) {
  return t(host.inferred ? 'firewall:publish:lacking:host:inferred' : 'firewall:publish:lacking:host', {
    host: host.host,
    agent: host.agent === '' ? '?' : host.agent,
    version: host.maxFormat,
    missing: new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(host.missing.map(capabilityLabel)),
  })
}

// refused only for such hosts: every other pool fine
const isRefusedForHostsOnly = computed(() => {
  const result = checkResult.value

  if (result === undefined || lackingPools.value.length === 0) {
    return false
  }

  return result.pools === undefined
    ? result.ok
    : result.error === undefined &&
        result.pools.every(pool => pool.ok || pool.unreachable || pool.otherXo || (pool.lacking?.length ?? 0) > 0)
})

const canPublishAnyway = computed(
  () => !shown.value.isOutdated && shown.value.changeCount > 0 && isRefusedForHostsOnly.value
)

const { open: openConfirm } = useOverlay({
  component: () => import('@/modules/vdf/components/VdfConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function publishAnyway() {
  if (!canPublishAnyway.value) {
    return
  }

  const pools = lackingPools.value
  const hosts = pools.flatMap(pool => pool.lacking.map(host => host.host))
  const response = await openConfirm({
    props: {
      accent: 'danger',
      icon: 'fa:shield',
      title: t('firewall:publish:anyway:title'),
      message: t(
        'firewall:publish:anyway:message',
        { hosts: new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(hosts), n: hosts.length },
        hosts.length
      ),
      confirmLabel: t('firewall:publish:anyway'),
    },
  })

  if (response.event === 'onConfirm' && canPublishAnyway.value) {
    emit(
      'confirm',
      pools.map(pool => pool.id)
    )
  }
}

const accent = computed<ModalAccent>(() =>
  lackingPools.value.length > 0 ? 'danger' : shown.value.isOutdated || isRisky.value ? 'warning' : 'info'
)

const isRejected = computed(
  () => checkError.value !== undefined || (checkResult.value?.ok === false && !isRefusedForHostsOnly.value)
)

const canPublish = computed(
  () =>
    !shown.value.isOutdated &&
    shown.value.changeCount > 0 &&
    checkResult.value?.ok === true &&
    lackingPools.value.length === 0
)

function confirm() {
  if (canPublish.value) {
    emit('confirm')
  }
}

// UNCHANGED WARNINGS: what the published document already warned about
// (the agent's check of it, XO's own notes on it) is told once, folded,
// rather than in every review (vdf#86 walkthrough)

type Note = { key: string; text: string; policy?: string }

function splitKnown(notes: Note[], before: Note[]) {
  const known = new Set(before.map(note => note.key))

  return { fresh: notes.filter(note => !known.has(note.key)), known: notes.filter(note => known.has(note.key)) }
}

// the agent's check of the published document
const baseCheck = ref<VdfCheckResult>()

const knownAgentWarnings = computed(
  () =>
    new Set([
      ...(baseCheck.value?.warnings ?? []),
      ...(baseCheck.value?.pools ?? []).flatMap(pool => (pool.warnings ?? []).map(raw => `${pool.id}|${raw}`)),
    ])
)

const isKnownWarning = (raw: string, poolId?: string) =>
  knownAgentWarnings.value.has(poolId === undefined ? raw : `${poolId}|${raw}`)

function newAgentWarnings(raws: string[] | undefined, poolId?: string) {
  return agentWarnings((raws ?? []).filter(raw => !isKnownWarning(raw, poolId)))
}

const unchanged = computed<Note[]>(() => {
  const poolName = (name: string, text: string) => `${name}: ${text}`
  const agent =
    checkResult.value?.pools !== undefined
      ? checkResult.value.pools.flatMap(pool =>
          agentWarnings((pool.warnings ?? []).filter(raw => isKnownWarning(raw, pool.id))).map(warning => ({
            key: `agent:${pool.id}:${warning.raw}`,
            text: poolName(pool.name, warning.text),
          }))
        )
      : agentWarnings((checkResult.value?.warnings ?? []).filter(raw => isKnownWarning(raw))).map(warning => ({
          key: `agent:${warning.raw}`,
          text: warning.text,
        }))

  return [
    ...agent,
    ...overriddenAll.value.known,
    ...overriddenPerPoolAll.value.flatMap(item =>
      item.known.map(note => ({ key: `${item.pool.id}:${note.key}`, text: poolName(item.pool.name, note.text) }))
    ),
    ...shadowNotes.value
      .filter(note => !note.isNew)
      .map(note => ({ key: note.key, text: note.pool === undefined ? note.text : poolName(note.pool, note.text) })),
  ]
})

// the agent's warnings in an admin's words, its own text in the tooltip;
// a text it is not known to write is shown as is
function agentWarnings(raws: string[] | undefined) {
  return (raws ?? []).map(raw => {
    const warning = parseAgentWarning(raw)

    if (warning === undefined) {
      return { raw, text: raw, tooltip: undefined, policy: undefined }
    }

    const params: Record<string, unknown> = { ...warning }

    if ('policy' in warning) {
      params.policy = displayName(warning.policy)
    }

    if ('other' in warning) {
      params.other = displayName(warning.other)
    }

    if ('rule' in warning) {
      params.rule = ruleNumber(warning.rule, { global: isGlobalScope(shown.value.scopeId) })
    }

    if ('tier' in warning) {
      params.tier = tierLabel(warning.tier)
    }

    if ('max' in warning) {
      params.max = n(warning.max)
    }

    return {
      raw,
      text: t(`firewall:publish:agent-warning:${warning.type}`, params),
      tooltip: raw,
      // the policy it's about, as the document names it
      policy: 'policy' in warning ? warning.policy : undefined,
    }
  })
}

onMounted(async () => {
  const { scopeId, document, isOutdated } = props

  if (!isGlobalScope(scopeId) && enforcing.value.length > 0) {
    fetchVdfMonitor(scopeId).then(
      entries => (monitorEntries.value = entries),
      () => undefined
    )
  }

  if (!isGlobalScope(scopeId) && details.value.policies.some(change => change.rules.some(r => r.type === 'removed'))) {
    fetchVdfOpenConnections(scopeId).then(
      counts => (openConnections.value = counts),
      () => undefined
    )
  }

  if (isOutdated) {
    return
  }

  // what the published document already warns about (a failure: nothing
  // is folded)
  checkVdfDocument(scopeId, props.baseDocument).then(
    result => (baseCheck.value = result),
    () => undefined
  )

  try {
    checkResult.value = await checkVdfDocument(scopeId, document)
  } catch (error) {
    checkError.value = (error as Error).message
  }
})
</script>

<style lang="postcss" scoped>
.vdf-publish-modal {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .pool-result {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .pool-name,
  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  .unchanged summary {
    cursor: pointer;
  }

  .unchanged-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-block-start: 0.8rem;
  }

  .checking {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
