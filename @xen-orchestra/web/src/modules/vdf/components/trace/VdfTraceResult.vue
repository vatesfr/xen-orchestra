<template>
  <div class="vdf-trace-result">
    <div class="verdict" :class="`verdict--${verdict}`">
      <span class="verdict-icon">
        <VtsIcon :name="verdictIcon" size="large" />
      </span>
      <div class="verdict-text">
        <span class="typo-h3">{{ t(`firewall:trace:verdict:${verdict}`) }}</span>
        <span class="typo-body-regular">{{ explanation }}</span>
        <div class="ends typo-body-regular-small">
          <span class="end">{{ endLabel(result.from) }}</span>
          <VtsIcon name="fa:arrow-right" size="small" />
          <span class="end">{{ endLabel(result.to) }}</span>
          <span class="secondary">{{
            t('firewall:trace:service-state', { service, state: t(`firewall:trace:state:${result.state}`) })
          }}</span>
        </div>
      </div>
      <UiLink v-if="decisionRoute" :to="decisionRoute" size="medium" icon="fa:layer-group" class="decision-link">
        {{ t('firewall:trace:show-rule') }}
      </UiLink>
    </div>

    <UiAlert v-if="otherwise" accent="info">
      {{ t('firewall:trace:otherwise') }}
      <template #description>{{ otherwise }}</template>
    </UiAlert>

    <div v-for="(hop, hopIndex) of result.hops" :key="hopIndex" class="hop">
      <div class="hop-header">
        <VtsIcon name="object:host" size="medium" />
        <span class="typo-h6">{{ hop.host }}</span>
        <span class="typo-body-regular-small secondary">
          {{ t('firewall:trace:hop', { side: hop.side, bridge: hop.bridge }) }}
        </span>
        <UiInfo v-if="hop.model" :accent="hop.model.agrees ? 'success' : 'warning'" class="model">
          {{ hop.model.agrees ? t('firewall:trace:model-agrees') : t('firewall:trace:model-disagrees') }}
        </UiInfo>
      </div>
      <UiAlert v-if="hop.stale" accent="warning">{{ hop.stale }}</UiAlert>
      <ol class="stages">
        <li
          v-for="(stage, stageIndex) of visibleStages(hop)"
          :key="stageIndex"
          class="stage"
          :class="[`stage--${stageOutcome(stage)}`, { decides: stage.decides }]"
        >
          <span class="dot"><VtsIcon :name="stageIcon(stage)" size="small" /></span>
          <div class="stage-body">
            <span :class="stage.decides ? 'typo-body-bold' : 'typo-body-regular'">{{ stage.text }}</span>
            <span class="typo-body-regular-small secondary">
              {{ t('firewall:trace:stage-meta', { kind: stage.kind, table: stage.table, priority: stage.priority }) }}
            </span>
          </div>
        </li>
        <li class="stage" :class="hop.delivered ? 'stage--allow' : 'stage--drop'">
          <span class="dot"><VtsIcon :name="hop.delivered ? 'fa:check' : 'fa:ban'" size="small" /></span>
          <div class="stage-body">
            <span class="typo-body-bold">
              {{ hop.delivered ? t('firewall:trace:delivered') : t('firewall:trace:not-delivered') }}
            </span>
            <span v-if="hop.l2" class="typo-body-regular-small secondary">{{ hop.l2 }}</span>
          </div>
        </li>
      </ol>
      <details class="details">
        <summary class="typo-body-regular-small">{{ t('firewall:trace:ovs-details') }}</summary>
        <dl class="typo-body-regular-small">
          <dt>{{ t('firewall:trace:packet') }}</dt>
          <dd>
            <code>{{ hop.packet }}</code>
          </dd>
          <dt>{{ t('firewall:trace:conntrack') }}</dt>
          <dd>
            <code>{{ hop.conntrack }}</code>
          </dd>
          <dt>{{ t('firewall:trace:datapath') }}</dt>
          <dd>
            <code>{{ hop.datapath_actions }}</code>
          </dd>
        </dl>
        <ol class="raw-stages">
          <li v-for="(stage, index) of hop.stages" :key="index" class="typo-body-regular-small">
            <code>{{
              t('firewall:trace:raw-stage', { table: stage.table, priority: stage.priority, match: stage.match })
            }}</code>
          </li>
        </ol>
      </details>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { VdfTraceEnd, VdfTraceHop, VdfTraceResult, VdfTraceStage } from '@/modules/vdf/types.ts'
import type { IconName } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { result, poolId } = defineProps<{
  poolId: string
  result: VdfTraceResult
}>()

const { t } = useI18n()

const lastHop = computed(() => result.hops[result.hops.length - 1])

const verdict = computed(() => {
  if (result.not_delivered) {
    return 'not-delivered'
  }

  return result.allowed ? 'allowed' : 'blocked'
})

const verdictIcon = computed<IconName>(
  () =>
    ({ allowed: 'fa:check', blocked: 'fa:ban', 'not-delivered': 'fa:triangle-exclamation' })[verdict.value] as IconName
)

const decision = computed(() => lastHop.value?.decision)

const explanation = computed(() => {
  if (decision.value === undefined) {
    return t('firewall:trace:no-decision')
  }

  return decision.value.text
})

const decisionRoute = computed<RouteLocationRaw | undefined>(() => {
  if (decision.value?.policy === undefined) {
    return undefined
  }

  const query: Record<string, string> = { policy: decision.value.policy }

  if (decision.value.rule) {
    query.rule = String(decision.value.rule)
  }

  return { name: '/pool/[id]/firewall/policies', params: { id: poolId }, query }
})

const otherwise = computed(() => result.hops.map(hop => hop.otherwise).find(Boolean))

const service = computed(() => {
  if (result.proto === 'any') {
    return t('firewall:any-protocol')
  }

  return result.port ? `${result.proto.toUpperCase()} ${result.port}` : result.proto.toUpperCase()
})

function endLabel(end: VdfTraceEnd) {
  return end.external ? t('firewall:trace:external', { ip: end.ip }) : `${end.vm} (${end.ip})`
}

// VDF's own stages: the rest is XAPI's anti-spoofing and OVS switching
function visibleStages(hop: VdfTraceHop) {
  return hop.stages.filter(stage => stage.vdf || stage.decides)
}

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

function stageAllows(stage: VdfTraceStage) {
  if (stage.kind === 'rule' || stage.kind === 'tier-default') {
    return stage.action === 'allow'
  }

  return ALLOWING_KINDS.includes(stage.kind)
}

function stageOutcome(stage: VdfTraceStage) {
  if (stage.action === 'pass') {
    return 'pass'
  }

  if (!stage.decides) {
    return 'step'
  }

  return stageAllows(stage) ? 'allow' : 'drop'
}

function stageIcon(stage: VdfTraceStage): IconName {
  return (
    { drop: 'fa:ban', pass: 'fa:arrow-down', allow: 'fa:check', step: 'fa:angle-right' } as Record<string, IconName>
  )[stageOutcome(stage)]
}
</script>

<style lang="postcss" scoped>
.vdf-trace-result {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .verdict {
    display: flex;
    align-items: flex-start;
    gap: 2.4rem;
    padding: 2.4rem;
    border-radius: 0.8rem;
    border: 0.1rem solid var(--vdf-verdict-item);
    background-color: var(--vdf-verdict-background);

    &.verdict--allowed {
      --vdf-verdict-item: var(--color-success-item-base);
      --vdf-verdict-background: var(--color-success-background-selected);
    }

    &.verdict--blocked {
      --vdf-verdict-item: var(--color-danger-item-base);
      --vdf-verdict-background: var(--color-danger-background-selected);
    }

    &.verdict--not-delivered {
      --vdf-verdict-item: var(--color-warning-item-base);
      --vdf-verdict-background: var(--color-warning-background-selected);
    }
  }

  .verdict-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 6.4rem;
    height: 6.4rem;
    border-radius: 50%;
    color: var(--color-neutral-background-primary);
    background-color: var(--vdf-verdict-item);
  }

  .verdict-text {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    flex: 1;

    .typo-h3 {
      color: var(--vdf-verdict-item);
    }
  }

  .ends {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .end {
    font-weight: 600;
  }

  .decision-link {
    align-self: center;
    white-space: nowrap;
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
      --vdf-stage-color: var(--color-success-item-base);
    }

    &.stage--pass {
      --vdf-stage-color: var(--color-info-item-base);
    }

    &.stage--drop {
      --vdf-stage-color: var(--color-danger-item-base);
    }
  }

  .stage-body {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding-block-start: 0.2rem;
  }

  .details {
    summary {
      cursor: pointer;
      color: var(--color-brand-txt-base);
    }

    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 0.4rem 1.6rem;
      margin-block: 0.8rem;
    }

    dt {
      color: var(--color-neutral-txt-secondary);
    }

    code {
      font-family: monospace;
      word-break: break-all;
    }
  }

  .raw-stages {
    padding-inline-start: 2rem;
    color: var(--color-neutral-txt-secondary);
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
