<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node host-node" :class="statusClass">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <span class="status-dot" />
      <RouterLink :to="{ name: '/host/[id]', params: { id: data.host.id } }" class="node-title">
        {{ data.host.name_label }}
      </RouterLink>
      <span class="vm-badge">{{ data.vmCount }} VMs</span>
    </div>
    <div class="resource-bars">
      <div class="bar-row">
        <span class="bar-label">RAM</span>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: ramPercent + '%' }" />
        </div>
        <span class="bar-value">{{ ramPercent }}%</span>
      </div>
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
import { HOST_POWER_STATE } from '@vates/types'
import { Handle, Position } from '@vue-flow/core'
import { computed, inject } from 'vue'

const props = defineProps<{ data: HostNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)

const ramPercent = computed(() => {
  if (props.data.memorySize === 0) return 0
  return Math.round((props.data.memoryUsage / props.data.memorySize) * 100)
})

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

  &.status-running {
    border-left: 0.3rem solid var(--color-success-item-base);

    .status-dot {
      background: var(--color-success-item-base);
    }
  }

  &.status-halted {
    border-left: 0.3rem solid var(--color-danger-item-base);

    .status-dot {
      background: var(--color-danger-item-base);
    }
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    .status-dot {
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 50%;
      flex-shrink: 0;
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

    .vm-badge {
      font-size: 1rem;
      color: var(--color-neutral-txt-secondary);
      white-space: nowrap;
    }
  }

  .resource-bars {
    margin-top: 0.8rem;

    .bar-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;

      .bar-label {
        font-size: 1rem;
        color: var(--color-neutral-txt-secondary);
        min-width: 2.8rem;
      }

      .bar-track {
        flex: 1;
        height: 0.6rem;
        background: var(--color-neutral-background-disabled);
        border-radius: 0.3rem;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 0.3rem;
        background: var(--color-warning-item-base);
        transition: width 0.3s ease;
      }

      .bar-value {
        font-size: 1rem;
        color: var(--color-neutral-txt-secondary);
        min-width: 3rem;
        text-align: right;
      }
    }
  }
}
</style>
