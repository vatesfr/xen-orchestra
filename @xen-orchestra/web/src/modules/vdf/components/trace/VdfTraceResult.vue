<template>
  <div class="vdf-trace-result">
    <div class="verdict">
      <UiAlert :accent="verdictAccent" class="verdict-alert">
        <span class="typo-body-bold">{{ t(`firewall:trace:verdict:${verdict}`) }}</span>
        <span class="ends">
          <span>{{ fromLabel }}</span>
          <VtsIcon name="fa:arrow-right" size="small" />
          <span>{{ toLabel }}</span>
          <span>{{
            t('firewall:trace:service-state', { service, state: t(`firewall:trace:state:${result.state}`) })
          }}</span>
        </span>
        <template #description>{{ explanation }}</template>
      </UiAlert>
      <div v-if="decisionRoute || allowRoute" class="actions">
        <UiLink v-if="decisionRoute" :to="decisionRoute" size="medium" icon="fa:layer-group">
          {{ t('firewall:trace:show-rule') }}
        </UiLink>
        <UiButton
          v-if="allowRoute"
          variant="secondary"
          accent="brand"
          size="medium"
          left-icon="fa:plus"
          @click="allowFlow()"
        >
          {{ t('firewall:trace:allow-flow') }}
        </UiButton>
      </div>
    </div>

    <UiAlert v-if="otherwise" accent="info">
      {{ t('firewall:trace:otherwise') }}
      <template #description>{{ otherwise }}</template>
    </UiAlert>

    <div v-for="hop of hops" :key="hop.key" class="hop">
      <div class="hop-header">
        <VtsIcon name="object:host" size="medium" />
        <span class="typo-body-bold">{{ hop.hop.host }}</span>
        <span class="typo-body-regular-small secondary">{{ hop.side }}</span>
        <UiInfo v-if="hop.hop.model" :accent="hop.hop.model.agrees ? 'success' : 'warning'" class="model">
          {{ hop.hop.model.agrees ? t('firewall:trace:model-agrees') : t('firewall:trace:model-disagrees') }}
        </UiInfo>
      </div>
      <UiAlert v-if="hop.hop.stale" accent="warning">{{ hop.hop.stale }}</UiAlert>
      <ol class="stages">
        <li
          v-for="stage of hop.stages"
          :key="stage.key"
          class="stage"
          :class="[`stage--${stage.outcome}`, { decides: stage.decides }]"
        >
          <span class="dot"><VtsIcon :name="stage.icon" size="small" /></span>
          <span :class="stage.decides ? 'typo-body-bold' : 'typo-body-regular'">{{ stage.label }}</span>
        </li>
        <li class="stage" :class="hop.hop.delivered ? 'stage--allow' : 'stage--drop'">
          <span class="dot"><VtsIcon :name="hop.hop.delivered ? 'fa:check' : 'fa:ban'" size="small" /></span>
          <div class="stage-body">
            <span class="typo-body-bold">
              {{ hop.hop.delivered ? t('firewall:trace:delivered') : t('firewall:trace:not-delivered') }}
            </span>
            <span v-if="hop.hop.l2" class="typo-body-regular-small secondary">{{ hop.hop.l2 }}</span>
          </div>
        </li>
      </ol>
      <VdfTechnicalDetails :label="t('firewall:trace:ovs-details')">
        <VtsTabularKeyValueList>
          <VtsTabularKeyValueRow :label="t('firewall:trace:bridge')" :value="hop.hop.bridge" />
          <VtsTabularKeyValueRow :label="t('firewall:trace:packet')" :value="hop.hop.packet" copy />
          <VtsTabularKeyValueRow :label="t('firewall:trace:conntrack')" :value="hop.hop.conntrack" />
          <VtsTabularKeyValueRow :label="t('firewall:trace:datapath')" :value="hop.hop.datapath_actions" copy />
        </VtsTabularKeyValueList>
        <ol class="raw-stages typo-body-regular-small">
          <li v-for="(stage, index) of hop.hop.stages" :key="index">
            <code>{{
              t('firewall:trace:raw-stage', { table: stage.table, priority: stage.priority, match: stage.match })
            }}</code>
            <span class="secondary">{{
              t('firewall:trace:raw-stage:text', { kind: stage.kind, text: stage.text })
            }}</span>
          </li>
        </ol>
      </VdfTechnicalDetails>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VdfTechnicalDetails from '@/modules/vdf/components/overview/VdfTechnicalDetails.vue'
import { ipMatches } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfTierLabel } from '@/modules/vdf/composables/vdf-tier-label.composable.ts'
import {
  VDF_GLOBAL_SCOPE,
  type VdfDocument,
  type VdfTraceEnd,
  type VdfTraceResult,
  type VdfTraceStage,
} from '@/modules/vdf/types.ts'
import { displayName, globalRuleId, isGlobalName, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { isVmInGroup } from '@/modules/vdf/utils/vdf-policy.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

const { result, poolId, document } = defineProps<{
  poolId: string
  result: VdfTraceResult
  // the published document: what the hosts traced against
  document: VdfDocument
}>()

const { t } = useI18n()

const router = useRouter()

const tierLabel = useVdfTierLabel()

const { vms } = useXoVmCollection()

const lastHop = computed(() => result.hops[result.hops.length - 1])

const verdict = computed(() => {
  if (result.not_delivered) {
    return 'not-delivered'
  }

  return result.allowed ? 'allowed' : 'dropped'
})

const VERDICT_ACCENTS = { allowed: 'success', dropped: 'danger', 'not-delivered': 'warning' } as const

const verdictAccent = computed(() => VERDICT_ACCENTS[verdict.value])

const decision = computed(() => lastHop.value?.decision)

function endLabel(end: VdfTraceEnd) {
  return end.external
    ? t('firewall:trace:external', { ip: end.ip })
    : t('firewall:trace:vm-end', { vm: end.vm, ip: end.ip })
}

const fromLabel = computed(() => endLabel(result.from))

const toLabel = computed(() => endLabel(result.to))

const service = computed(() => {
  if (result.proto === 'any') {
    return t('firewall:any-protocol')
  }

  const proto = result.proto.toUpperCase()

  return result.port ? t('firewall:recent-drops:service', { proto, port: result.port }) : proto
})

// STAGES, in policy terms: tiers by name, global objects without their
// prefix; the agent's own wording for the rest (anti-spoofing, conntrack…)

function actionLabel(action: string | undefined) {
  if (action === 'allow' || action === 'drop') {
    return t(`firewall:action:${action}`)
  }

  return t('firewall:action:next-tier')
}

function stageLabel(stage: VdfTraceStage) {
  if (stage.tier === undefined) {
    return stage.text
  }

  const tier = tierLabel(stage.tier)

  if (stage.kind === 'rule' && stage.policy !== undefined && stage.rule !== undefined) {
    return t('firewall:trace:stage:rule', {
      tier,
      policy: displayName(stage.policy),
      rule: globalRuleId(stage.rule),
      action: actionLabel(stage.action),
    })
  }

  if (stage.kind === 'tier-default') {
    return stage.policy === undefined
      ? t('firewall:trace:stage:tier-default', { tier, action: actionLabel(stage.action) })
      : t('firewall:trace:stage:policy-default', {
          tier,
          policy: displayName(stage.policy),
          action: actionLabel(stage.action),
        })
  }

  return stage.text
}

const explanation = computed(() =>
  decision.value === undefined ? t('firewall:trace:no-decision') : stageLabel(decision.value)
)

// as agent/trace.go allows(): what a deciding stage does with the packet
const ALLOWING_KINDS = [
  'final',
  'bcast-final',
  'reply',
  'egress-commit',
  'unprotected',
  'bcast-always',
  'bypass',
  'dhcp',
]

function stageOutcome(stage: VdfTraceStage) {
  if (stage.action === 'pass') {
    return 'pass'
  }

  if (!stage.decides) {
    return 'step'
  }

  if (stage.kind === 'rule' || stage.kind === 'tier-default') {
    return stage.action === 'allow' ? 'allow' : 'drop'
  }

  return ALLOWING_KINDS.includes(stage.kind) ? 'allow' : 'drop'
}

const STAGE_ICONS: Record<ReturnType<typeof stageOutcome>, IconName> = {
  drop: 'fa:ban',
  pass: 'fa:arrow-down',
  allow: 'fa:check',
  step: 'fa:angle-right',
}

function sideLabel(side: string) {
  if (side === 'source' || side === 'destination' || side === 'source and destination') {
    return t(`firewall:trace:side:${side.replaceAll(' ', '-')}`)
  }

  return side
}

// VDF's own stages: the rest is XAPI's anti-spoofing and OVS switching,
// left in the technical details
const hops = computed(() =>
  result.hops.map((hop, hopIndex) => ({
    key: hopIndex,
    hop,
    side: sideLabel(hop.side),
    stages: hop.stages
      .filter(stage => stage.vdf || stage.decides)
      .map((stage, stageIndex) => {
        const outcome = stageOutcome(stage)

        return {
          key: stageIndex,
          label: stageLabel(stage),
          decides: stage.decides,
          outcome,
          icon: STAGE_ICONS[outcome],
        }
      }),
  }))
)

const otherwise = computed(() => result.hops.map(hop => hop.otherwise).find(Boolean))

// LINKS

const decisionRoute = computed<RouteLocationRaw | undefined>(() => {
  if (decision.value?.policy === undefined) {
    return undefined
  }

  return vdfPageRoute(poolId, 'policies', { policy: decision.value.policy, rule: decision.value.rule || undefined })
})

// the group the source belongs to, as a rule of the deciding policy can
// name it (a global policy only knows global groups)
const sourceGroup = computed(() => {
  const policy = document.policies.find(({ name }) => name === decision.value?.policy)

  if (policy === undefined) {
    return undefined
  }

  const onlyGlobal = isGlobalName(policy.name)
  const sourceVm = result.from.external ? undefined : vms.value.find(vm => vm.id === result.from.uuid)

  const candidates = Object.entries(document.groups)
    .filter(([name]) => name !== policy.appliedTo && (!onlyGlobal || isGlobalName(name)))
    .filter(([, group]) =>
      sourceVm === undefined
        ? (group.ips ?? []).some(member => ipMatches(result.from.ip, member))
        : isVmInGroup(sourceVm.tags, group)
    )
    // the pool's own groups first
    .sort(([nameA], [nameB]) => Number(isGlobalName(nameA)) - Number(isGlobalName(nameB)))

  return candidates[0]?.[0]
})

// "Allow this flow…": the Policies page opens a new rule in the deciding
// policy, prefilled with this flow
const allowRoute = computed<RouteLocationRaw | undefined>(() => {
  const policy = decision.value?.policy

  if (verdict.value !== 'dropped' || policy === undefined || decision.value?.action !== 'drop') {
    return undefined
  }

  const isGlobal = isGlobalName(policy)
  const route = vdfPageRoute(isGlobal ? VDF_GLOBAL_SCOPE : poolId, 'policies', { policy }) as {
    query: Record<string, string>
  }
  const from = sourceGroup.value === undefined ? 'any' : isGlobal ? displayName(sourceGroup.value) : sourceGroup.value

  return {
    ...route,
    query: {
      ...route.query,
      newRule: '1',
      from,
      proto: result.proto,
      port: result.port === undefined ? undefined : String(result.port),
    },
  } as RouteLocationRaw
})

function allowFlow() {
  if (allowRoute.value !== undefined) {
    return router.push(allowRoute.value)
  }
}
</script>

<style lang="postcss" scoped>
.vdf-trace-result {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;
  }

  .verdict-alert {
    flex: 1;
    min-width: 32rem;
  }

  .ends {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem 0.8rem;
    margin-inline-start: 0.8rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.6rem;
  }

  .hop {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .hop-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
    padding-block-end: 0.8rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);

    .model {
      margin-inline-start: auto;
    }
  }

  .stages {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .stage {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 1.6rem;
    padding-block-end: 1.6rem;

    /* the line linking the stages */
    &:not(:last-child)::before {
      content: '';
      position: absolute;
      inset-block: 2.8rem 0;
      inset-inline-start: 1.35rem;
      width: 0.2rem;
      background-color: var(--color-neutral-border);
    }

    .dot {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 2.8rem;
      height: 2.8rem;
      border-radius: 50%;
      border: 0.2rem solid var(--vdf-stage-color);
      color: var(--vdf-stage-color);
      background-color: var(--color-neutral-background-primary);
    }

    &.decides .dot {
      color: var(--color-neutral-background-primary);
      background-color: var(--vdf-stage-color);
    }

    &.stage--step {
      --vdf-stage-color: var(--color-neutral-txt-secondary);
    }

    &.stage--allow {
      --vdf-stage-color: var(--color-success-txt-base);
    }

    &.stage--pass {
      --vdf-stage-color: var(--color-info-txt-base);
    }

    &.stage--drop {
      --vdf-stage-color: var(--color-danger-txt-base);
    }

    > span:last-child {
      padding-block-start: 0.2rem;
    }
  }

  .stage-body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding-block-start: 0.2rem;
  }

  .raw-stages {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
    padding-inline-start: 2rem;

    li {
      display: flex;
      flex-direction: column;
      word-break: break-all;
    }
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
