<template>
  <div class="vdf-flow-map">
    <VtsStateHero v-if="nodes.length === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('firewall:flow-map:empty') }}
    </VtsStateHero>
    <template v-else>
      <svg
        class="map"
        :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
        role="img"
        :aria-label="t('firewall:flow-map:summary', { allowed: allowedCount, dropped: droppedCount })"
      >
        <defs>
          <marker
            v-for="kind of ['allow', 'drop']"
            :id="`${uid}-${kind}`"
            :key="kind"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="12"
            markerHeight="12"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" :class="`arrow arrow--${kind}`" />
          </marker>
        </defs>

        <g
          v-for="edge of edges"
          :key="edge.key"
          class="edge"
          :class="[`edge--${edge.kind}`, { traceable: edge.trace !== undefined }]"
          @click="edge.trace !== undefined && openTrace(poolId, edge.trace)"
        >
          <title>{{ edge.title }}</title>
          <!-- a wide transparent copy: easier to point at -->
          <path :d="edge.path" class="hit" />
          <path :d="edge.path" class="line" :style="{ strokeWidth: edge.width }" :marker-end="`url(#${uid}-${edge.kind})`" />
          <circle v-if="edge.kind === 'drop'" :cx="edge.end.x" :cy="edge.end.y" r="6" class="pulse" />
        </g>

        <g v-for="node of nodes" :key="node.key" class="node" :class="`node--${node.kind}`">
          <title>{{ node.title }}</title>
          <circle :cx="node.x" :cy="node.y" :r="RADIUS" class="disc" />
          <text :x="node.x" :y="node.y + 5" class="count">{{ node.members }}</text>
          <text :x="node.x" :y="node.y + RADIUS + 22" class="label">{{ node.label }}</text>
        </g>
      </svg>
      <div class="legend typo-body-regular-small">
        <span class="item"><span class="swatch swatch--allow" />{{ t('firewall:flow-map:allowed', { n: allowedCount }) }}</span>
        <span class="item"><span class="swatch swatch--drop" />{{ t('firewall:flow-map:dropped', { n: droppedCount }) }}</span>
        <span class="secondary">{{ t('firewall:flow-map:hint') }}</span>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import type { VdfConnectionItem } from '@/modules/vdf/components/live/VdfConnectionsTable.vue'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfTraceDrawer } from '@/modules/vdf/composables/vdf-trace-drawer.composable.ts'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import { displayName, isGlobalName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { recentDrops } from '@/modules/vdf/utils/vdf-recent-drops.util.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useNow } from '@vueuse/core'
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'

// The pool's traffic between its groups: the groups policies apply to
// (a VM in the most specific of them), the pool's other VMs, and outside
// (addresses, other pools' VMs). Green, moving toward the destination: open
// connections, thicker with more of them. Red, pulsing at the destination:
// what was dropped in the last minute (the rule log: rules and policies
// that log their drops). A link traces one of its flows, in the drawer.
const { poolId, document, connections, paused = false } = defineProps<{
  poolId: string
  // the published document: what the hosts enforce
  document: VdfDocument
  connections: VdfConnectionItem[]
  paused?: boolean
}>()

const { t } = useI18n()

const uid = useId()

const { openTrace } = useVdfTraceDrawer()

const { poolVms, membersOf } = useVdfMembers(() => poolId, () => document)

const { vmByIp } = useVdfIpNames(() => document)

const { ruleLog } = useVdfRuleLog({ isEnabled: computed(() => !paused) }, () => poolId)

const now = useNow({ interval: 5000 })

const DROP_WINDOW_MS = 60_000

// GEOMETRY: the nodes on an ellipse, outside first, on the left
const WIDTH = 1000
const HEIGHT = 440
const RADIUS = 30
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 - 14 }
const ELLIPSE = { rx: 390, ry: 150 }

const OUTSIDE = 'outside'
const OTHER = 'other'

// a VM's node: the smallest group it's in among those policies apply to
const groupOfVm = computed(() => {
  const names = [...new Set(document.policies.map(policy => policy.appliedTo))]
  const sized = names
    .map(name => ({ name, members: membersOf(name) }))
    // the pool's own group before a global one of the same size
    .sort(
      (groupA, groupB) =>
        groupA.members.length - groupB.members.length ||
        Number(isGlobalName(groupA.name)) - Number(isGlobalName(groupB.name))
    )
  const result = new Map<string, string>()

  for (const { name, members } of sized) {
    for (const vm of members) {
      if (!result.has(vm.id)) {
        result.set(vm.id, name)
      }
    }
  }

  return result
})

const poolVmIds = computed(() => new Set(poolVms.value.map(vm => vm.id)))

function nodeOfVm(vm: FrontXoVm | undefined) {
  if (vm === undefined || !poolVmIds.value.has(vm.id)) {
    return OUTSIDE
  }

  return groupOfVm.value.get(vm.id) ?? OTHER
}

const nodeOfIp = (ip: string) => nodeOfVm(vmByIp.value.get(ip))

const vmByName = computed(() => new Map(poolVms.value.map(vm => [vm.name_label, vm])))

type Flow = { from: string; to: string; kind: 'allow' | 'drop'; count: number; trace?: VdfTraceQuery; by?: string }

const TRACEABLE = ['tcp', 'udp', 'icmp']

// an end of a traced flow: a VM of the pool by id, anything else by address
function traceEnd(vm: FrontXoVm | undefined, ip: string) {
  return vm !== undefined && poolVmIds.value.has(vm.id) ? { id: vm.id } : { id: 'external', ip }
}

function traceQuery(
  from: { id: string; ip?: string },
  to: { id: string; ip?: string },
  proto: string,
  port?: string | number
): VdfTraceQuery | undefined {
  const protocol = proto.toLowerCase()

  return TRACEABLE.includes(protocol) && (from.id !== 'external' || to.id !== 'external')
    ? {
        from: from.id,
        fromip: from.ip,
        to: to.id,
        toip: to.ip,
        proto: protocol,
        port: protocol === 'icmp' || port === undefined || port === '' ? undefined : String(port),
        run: '1',
      }
    : undefined
}

const flows = computed<Flow[]>(() => {
  const allowed = connections
    .filter(connection => !connection.revoked)
    .map(
      (connection): Flow => ({
        from: connection.src.vm !== undefined ? nodeOfVm(connection.src.vm) : nodeOfIp(connection.src.ip),
        to: connection.dst.vm !== undefined ? nodeOfVm(connection.dst.vm) : nodeOfIp(connection.dst.ip),
        kind: 'allow',
        count: 1,
        trace: traceQuery(
          traceEnd(connection.src.vm, connection.src.ip),
          traceEnd(connection.dst.vm, connection.dst.ip),
          connection.proto,
          connection.port
        ),
        // an outbound connection (vdf#53): its source's rule let it out
        by: connection.decision?.label ?? connection.egressDecision?.label,
      })
    )
  const dropped = recentDrops(ruleLog.value?.entries ?? [], { since: now.value.getTime() - DROP_WINDOW_MS }).map(
    (drop): Flow => {
      const logged = vmByName.value.get(drop.vm)

      // egress (vdf#53): the logged VM is the source
      return drop.egress
        ? {
            from: nodeOfVm(logged),
            to: nodeOfIp(drop.dst ?? ''),
            kind: 'drop',
            count: drop.count,
            trace: traceQuery(traceEnd(logged, ''), traceEnd(vmByIp.value.get(drop.dst ?? ''), drop.dst ?? ''), drop.proto, drop.port),
            by: displayName(drop.policy),
          }
        : {
            from: nodeOfIp(drop.src),
            to: nodeOfVm(logged),
            kind: 'drop',
            count: drop.count,
            trace: traceQuery(traceEnd(vmByIp.value.get(drop.src), drop.src), traceEnd(logged, ''), drop.proto, drop.port),
            by: displayName(drop.policy),
          }
    }
  )

  return [...allowed, ...dropped].filter(flow => flow.from !== flow.to)
})

const allowedCount = computed(() => flows.value.filter(flow => flow.kind === 'allow').length)

const droppedCount = computed(() =>
  flows.value.filter(flow => flow.kind === 'drop').reduce((sum, flow) => sum + flow.count, 0)
)

// the groups policies apply to that hold VMs here (a VM in the most
// specific: a larger group may hold none), even quiet; outside and the
// other VMs when traffic involves them
const nodes = computed(() => {
  const held = new Map<string, number>()

  for (const vm of poolVms.value) {
    const key = groupOfVm.value.get(vm.id) ?? OTHER

    held.set(key, (held.get(key) ?? 0) + 1)
  }

  const used = new Set(flows.value.flatMap(flow => [flow.from, flow.to]))
  const groups = [...new Set(document.policies.map(policy => policy.appliedTo))]
    .filter(name => held.has(name) || used.has(name))
    .sort((nameA, nameB) => displayName(nameA).localeCompare(displayName(nameB)))
  const keys = [
    ...(used.has(OUTSIDE) ? [OUTSIDE] : []),
    ...groups,
    ...(used.has(OTHER) ? [OTHER] : []),
  ]
  const membersCount = (key: string) => (key === OUTSIDE ? '' : String(held.get(key) ?? 0))

  return keys.map((key, index) => {
    // from the left, clockwise
    const angle = Math.PI + (2 * Math.PI * index) / keys.length
    // a global group as the chips name it: it may share its name with the pool's
    const label =
      key === OUTSIDE
        ? t('firewall:flow-map:outside')
        : key === OTHER
          ? t('firewall:flow-map:other')
          : isGlobalName(key)
            ? t('firewall:flow-map:global-group', { name: displayName(key) })
            : key

    return {
      key,
      kind: key === OUTSIDE ? 'outside' : key === OTHER ? 'other' : 'group',
      label,
      members: membersCount(key),
      title: key === OUTSIDE ? t('firewall:flow-map:outside:info') : label,
      x: CENTER.x + ELLIPSE.rx * Math.cos(angle),
      y: CENTER.y + ELLIPSE.ry * Math.sin(angle),
    }
  })
})

// a curve between two nodes, bent to one side: the way back takes the other
const edges = computed(() => {
  const positions = new Map(nodes.value.map(node => [node.key, node]))
  const merged = new Map<string, Flow & { flows: number }>()

  for (const flow of flows.value) {
    const key = `${flow.from}>${flow.to}:${flow.kind}`
    const known = merged.get(key)

    if (known === undefined) {
      merged.set(key, { ...flow, flows: 1 })
    } else {
      known.count += flow.count
      known.flows++
      known.trace ??= flow.trace
    }
  }

  return [...merged.entries()].flatMap(([key, edge]) => {
    const from = positions.get(edge.from)
    const to = positions.get(edge.to)

    if (from === undefined || to === undefined) {
      return []
    }

    const dx = to.x - from.x
    const dy = to.y - from.y
    const length = Math.hypot(dx, dy)
    const [ux, uy] = [dx / length, dy / length]
    // a drop bends further: it doesn't hide the same pair's open connections
    const bend = length * (edge.kind === 'drop' ? 0.22 : 0.12)
    const control = { x: (from.x + to.x) / 2 - uy * bend, y: (from.y + to.y) / 2 + ux * bend }
    const leave = towards(from, control, RADIUS + 4)
    const end = towards(to, control, RADIUS + 6)

    return [
      {
        key,
        kind: edge.kind,
        path: `M ${leave.x} ${leave.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
        end,
        width: 1.5 + Math.min(Math.log2(edge.count + 1), 5),
        trace: edge.trace,
        title: t(
          edge.kind === 'allow' ? 'firewall:flow-map:edge:allow' : 'firewall:flow-map:edge:drop',
          { from: from.label, to: to.label, n: edge.count, by: edge.by ?? '?' },
          edge.count
        ),
      },
    ]
  })
})

// the point at `distance` from a node's center, toward `point`
function towards(center: { x: number; y: number }, point: { x: number; y: number }, distance: number) {
  const dx = point.x - center.x
  const dy = point.y - center.y
  const length = Math.hypot(dx, dy) || 1

  return { x: center.x + (dx / length) * distance, y: center.y + (dy / length) * distance }
}
</script>

<style lang="postcss" scoped>
.vdf-flow-map {
  --allow-color: var(--color-success-txt-base);
  --drop-color: var(--color-danger-txt-base);

  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .map {
    width: 100%;
    max-height: 48rem;
  }

  .edge {
    .hit {
      fill: none;
      stroke: transparent;
      stroke-width: 14;
    }

    .line {
      fill: none;
      stroke-linecap: round;
    }

    &.traceable {
      cursor: pointer;

      &:hover .line {
        filter: drop-shadow(0 0 0.3rem currentcolor);
      }
    }

    &.edge--allow {
      color: var(--allow-color);

      .line {
        stroke: var(--allow-color);
        stroke-dasharray: 8 8;
        animation: flow 1.2s linear infinite;
      }
    }

    &.edge--drop {
      color: var(--drop-color);

      .line {
        stroke: var(--drop-color);
        stroke-dasharray: 2 6;
        opacity: 0.85;
      }

      .pulse {
        fill: var(--drop-color);
        transform-box: fill-box;
        transform-origin: center;
        animation: pulse 1.6s ease-out infinite;
      }
    }
  }

  .arrow--allow {
    fill: var(--allow-color);
  }

  .arrow--drop {
    fill: var(--drop-color);
  }

  .node {
    .disc {
      fill: var(--color-neutral-background-primary);
      stroke: var(--color-brand-item-base);
      stroke-width: 2.5;
    }

    .count {
      font-size: 1.6rem;
      font-weight: 600;
      text-anchor: middle;
      fill: var(--color-neutral-txt-primary);
    }

    .label {
      font-size: 1.5rem;
      font-weight: 600;
      text-anchor: middle;
      fill: var(--color-neutral-txt-primary);
    }

    &.node--outside .disc {
      stroke: var(--color-neutral-txt-secondary);
      stroke-dasharray: 4 4;
    }

    &.node--other .disc {
      stroke: var(--color-neutral-border);
    }
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem 2.4rem;

    .item {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
    }

    .swatch {
      width: 2.4rem;
      height: 0.3rem;
      border-radius: 0.2rem;

      &.swatch--allow {
        background-color: var(--allow-color);
      }

      &.swatch--drop {
        background: repeating-linear-gradient(90deg, var(--drop-color) 0 0.3rem, transparent 0.3rem 0.8rem);
      }
    }

    .secondary {
      color: var(--color-neutral-txt-secondary);
    }
  }

  @keyframes flow {
    to {
      stroke-dashoffset: -32;
    }
  }

  @keyframes pulse {
    0% {
      opacity: 0.9;
      transform: scale(0.6);
    }

    100% {
      opacity: 0;
      transform: scale(2.4);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .edge .line,
    .edge .pulse {
      animation: none;
    }
  }
}
</style>
