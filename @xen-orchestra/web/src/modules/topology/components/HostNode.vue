<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node host-node" :class="statusClass">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faServer" class="node-icon" />
      </span>
      <RouterLink :to="{ name: '/host/[id]', params: { id: data.host.id } }" class="node-title">
        {{ data.host.name_label }}
      </RouterLink>
      <span class="vm-pill">{{ data.vmCount }} VMs</span>
      <span v-if="data.runningVmCount > 0" class="running-pill">{{ data.runningVmCount }} running</span>
    </div>
    <div class="resource-bars">
      <div :class="{ 'cpu-critical': (data.cpuPercent ?? 0) >= 80 }">
        <VtsProgressBar :current="data.cpuPercent ?? 0" :total="100" label="CPU" legend-type="percent" noruler />
      </div>
      <VtsProgressBar :current="data.memoryUsage" :total="data.memorySize" label="RAM" legend-type="percent" noruler />
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(`host-${data.host.id}`)"
    />
    <Handle v-else type="source" :position="Position.Bottom" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { HostNodeData } from '@/modules/topology/types/topology.types.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import { faServer } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { HOST_POWER_STATE } from '@vates/types'
import { Handle, Position } from '@vue-flow/core'
import { computed, inject } from 'vue'

const props = defineProps<{ data: HostNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)

const statusClass = computed(() =>
  props.data.host.power_state === HOST_POWER_STATE.RUNNING ? 'status-running' : 'status-halted'
)
</script>

<style lang="postcss" scoped>
.host-node {
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;
  padding: 1rem 1.4rem;
  padding-bottom: 2rem;
  min-width: 22rem;
  position: relative;
  box-shadow: var(--shadow-200);
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-300);
    transform: translateY(-0.2rem);
  }

  :root.dark & {
    box-shadow: 0 0.2rem 0.8rem rgba(255, 255, 255, 0.06);

    &:hover {
      box-shadow: 0 0.4rem 1.4rem rgba(255, 255, 255, 0.1);
    }
  }

  &.status-running {
    border-left: 0.3rem solid var(--color-success-item-base);

    .icon-circle {
      background: var(--color-success-background-selected);
      color: var(--color-success-item-base);

      :root.dark & {
        background: color-mix(in srgb, var(--color-success-item-base) 20%, transparent);
      }
    }
  }

  &.status-halted {
    border-left: 0.3rem solid var(--color-danger-item-base);

    .icon-circle {
      background: var(--color-danger-background-selected);
      color: var(--color-danger-item-base);

      :root.dark & {
        background: color-mix(in srgb, var(--color-danger-item-base) 20%, transparent);
      }
    }
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;

    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 50%;
      flex-shrink: 0;

      .node-icon {
        font-size: 1rem;
      }
    }

    .node-title {
      font-weight: 500;
      font-size: 1.2rem;
      color: var(--color-neutral-txt-primary);
      text-decoration: none;
      flex: 1;

      &:hover {
        color: var(--color-brand-item-hover);
      }
    }

    .vm-pill {
      display: inline-block;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-neutral-txt-secondary);
      background: var(--color-neutral-background-secondary);
      padding: 0.1rem 0.6rem;
      border-radius: 10rem;
      white-space: nowrap;

      :root.dark & {
        background: color-mix(in srgb, var(--color-neutral-txt-secondary) 15%, transparent);
      }
    }

    .running-pill {
      display: inline-block;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-success-item-base);
      background: var(--color-success-background-selected);
      padding: 0.1rem 0.6rem;
      border-radius: 10rem;
      white-space: nowrap;

      :root.dark & {
        background: color-mix(in srgb, var(--color-success-item-base) 20%, transparent);
      }
    }
  }

  .resource-bars {
    margin-top: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .cpu-critical {
      position: relative;
      animation: cpu-pulse 2s ease-in-out infinite;
    }
  }
}

@keyframes cpu-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}
</style>
