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
          </template>
        </section>

        <section v-if="warnings.length > 0" class="section">
          <h3 class="typo-body-bold">{{ t('firewall:publish:warnings') }}</h3>
          <UiInfo v-for="warning of warnings" :key="warning.key" accent="warning" wrap>{{ warning.text }}</UiInfo>
        </section>

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
              <UiInfo v-else accent="danger" wrap>
                {{ t('firewall:publish:validation-failed', { error: pool.error }) }}
              </UiInfo>
              <UiInfo
                v-for="warning of agentWarnings(pool.warnings)"
                :key="warning.raw"
                v-tooltip="warning.tooltip"
                accent="warning"
                wrap
              >
                {{ warning.text }}
              </UiInfo>
              <template v-if="!pool.skipped && !pool.unreachable">
                <UiInfo v-for="note of hostNotes[pool.id] ?? []" :key="note.key" accent="warning" wrap>
                  {{ note.text }}
                </UiInfo>
              </template>
              <UiInfo v-for="note of overriddenPerPool[pool.id] ?? []" :key="note.key" accent="warning" wrap>
                {{ note.text }}
              </UiInfo>
            </div>
          </template>
          <template v-else-if="checkResult !== undefined">
            <UiInfo
              v-if="checkResult.ok"
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
            <UiInfo
              v-for="warning of agentWarnings(checkResult.warnings)"
              :key="warning.raw"
              v-tooltip="warning.tooltip"
              accent="warning"
              wrap
            >
              {{ warning.text }}
            </UiInfo>
          </template>
          <template v-if="!isGlobalScope(shown.scopeId)">
            <UiInfo v-for="note of hostNotes[shown.scopeId] ?? []" :key="note.key" accent="warning" wrap>
              {{ note.text }}
            </UiInfo>
          </template>
        </section>

        <UiAlert v-if="shown.publishError" accent="danger">{{ shown.publishError }}</UiAlert>
        <UiAlert v-else-if="!shown.isOutdated" accent="info">
          {{ isGlobalScope(shown.scopeId) ? t('firewall:global:publish:effect') : t('firewall:publish:effect') }}
        </UiAlert>
        <UiInfo v-if="isRejected" accent="danger" wrap>{{ t('firewall:publish:fix-errors') }}</UiInfo>
      </div>
    </template>
    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
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
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import { useVdfTrafficRules } from '@/modules/vdf/composables/vdf-traffic-rules.composable.ts'
import { checkVdfDocument, fetchVdfMonitor, fetchVdfOpenConnections } from '@/modules/vdf/jobs/vdf-publish.job.ts'
import { useVdfGlobal } from '@/modules/vdf/remote-resources/use-vdf-global.ts'
import type {
  VdfCheckResult,
  VdfDefaultAction,
  VdfDocument,
  VdfGlobalDocument,
  VdfMonitorEntry,
  VdfScopeId,
} from '@/modules/vdf/types.ts'
import { parseAgentWarning } from '@/modules/vdf/utils/vdf-agent-warning.util.ts'
import {
  changeDetails,
  hostWarnings,
  overriddenDefaults,
  publishWarnings,
} from '@/modules/vdf/utils/vdf-change.util.ts'
import {
  composeWithGlobal,
  displayName,
  globalRuleId,
  inGlobalScope,
  isGlobalScope,
} from '@/modules/vdf/utils/vdf-global.util.ts'
import { coveredBy, enforcedPolicies, isMonitored, seenSince } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import { groupNetworks, isOnNetworks } from '@/modules/vdf/utils/vdf-networks.util.ts'
import { vmGroupNames } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { agentGaps, parseHostStatus } from '@/modules/vdf/utils/vdf-status.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ModalAccent } from '@core/components/ui/modal/UiModal.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useOverlayTrigger } from '@core/packages/overlay/use-overlay-trigger.ts'
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
  confirm: []
  cancel: []
  rebase: []
}>()

const { t, n } = useI18n()

// A publish clears the draft before the modal has faded out: while the
// overlay handles Publish (or Cancel), the modal keeps showing what it had,
// rather than an empty draft. A failed publish leaves it open, live again.
const { isDisabled: isHandling } = useOverlayTrigger()

const frozen = shallowRef<typeof props>()

watch(isHandling, handling => (frozen.value = handling ? { ...props } : undefined), { flush: 'sync' })

const shown = computed(() => frozen.value ?? props)

// the draft's own changes, never what others published meanwhile
const details = computed(() => changeDetails(shown.value.baseDocument, shown.value.document))

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
const overridden = computed(() =>
  isGlobalScope(shown.value.scopeId) ? [] : overriddenIn(shown.value.document, shown.value.scopeId)
)

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
  const protects = (doc: VdfDocument) => {
    const appliedTo = new Set(enforcedPolicies(doc).map(policy => policy.appliedTo))

    return (tags: string[]) => vmGroupNames(tags, doc).some(name => appliedTo.has(name))
  }
  const now = protects(document)
  const before = protects(baseDocument)

  return vms.value
    .filter(vm => poolIds.has(vm.$pool) && now(vm.tags) && !before(vm.tags))
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

const warnings = computed(() => [
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
          { rule: globalRuleId(warning.rule), policy, n: n(warning.count) },
          warning.count
        ),
      }
    }

    return {
      key: `${warning.type}:${warning.policy}`,
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
        }
      })
)

// what the pool master's agent makes of the draft, before anything is written
const checkResult = ref<VdfCheckResult>()

const checkError = ref<string>()

// a global publish: each pool in scope, its own part as the check found it
// with the draft's global configuration
const overriddenPerPool = computed<Record<string, { key: string; text: string }[]>>(() =>
  isGlobalScope(shown.value.scopeId)
    ? Object.fromEntries(
        (checkResult.value?.pools ?? [])
          .filter(pool => pool.own !== undefined)
          .map(pool => [pool.id, overriddenIn(composeWithGlobal(pool.own!, shown.value.document), pool.id)])
      )
    : {}
)

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

const isRisky = computed(
  () =>
    warnings.value.length > 0 ||
    enforced.value.some(item => item.flows > 0) ||
    Object.values(hostNotes.value).some(notes => notes.length > 0) ||
    Object.values(overriddenPerPool.value).some(notes => notes.length > 0) ||
    details.value.groups.some(change => change.type === 'removed') ||
    details.value.policies.some(
      change => change.type === 'removed' || change.rules.some(rule => rule.type === 'removed')
    )
)

const accent = computed<ModalAccent>(() => (shown.value.isOutdated || isRisky.value ? 'warning' : 'info'))

const isRejected = computed(() => checkError.value !== undefined || checkResult.value?.ok === false)

const canPublish = computed(
  () => !shown.value.isOutdated && shown.value.changeCount > 0 && checkResult.value?.ok === true
)

function confirm() {
  if (canPublish.value) {
    emit('confirm')
  }
}

// the agent's warnings in an admin's words, its own text in the tooltip;
// a text it is not known to write is shown as is
function agentWarnings(raws: string[] | undefined) {
  return (raws ?? []).map(raw => {
    const warning = parseAgentWarning(raw)

    if (warning === undefined) {
      return { raw, text: raw, tooltip: undefined }
    }

    const params: Record<string, unknown> = { ...warning }

    if ('policy' in warning) {
      params.policy = displayName(warning.policy)
    }

    if ('other' in warning) {
      params.other = displayName(warning.other)
    }

    if ('rule' in warning) {
      params.rule = globalRuleId(warning.rule)
    }

    if ('tier' in warning) {
      params.tier = tierLabel(warning.tier)
    }

    if ('max' in warning) {
      params.max = n(warning.max)
    }

    return { raw, text: t(`firewall:publish:agent-warning:${warning.type}`, params), tooltip: raw }
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

  .checking {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
