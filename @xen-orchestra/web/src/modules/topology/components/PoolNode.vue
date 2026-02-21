<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node pool-node" :class="isLR ? 'dir-lr' : 'dir-tb'">
    <Handle type="target" :position="isLR ? Position.Left : Position.Top" />
    <div class="node-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faCity" class="node-icon" />
      </span>
      <RouterLink :to="{ name: '/pool/[id]', params: { id: data.pool.id } }" class="node-title">
        {{ data.pool.name_label }}
      </RouterLink>
    </div>
    <div class="node-info">
      {{ data.hostCount }} {{ data.hostCount === 1 ? 'node' : 'nodes' }}, {{ data.vmCount }} VMs
    </div>
    <div class="node-running">
      <span class="running-pill">{{ data.runningVmCount }} running</span>
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(`pool-${data.pool.id}`)"
    />
    <Handle v-else type="source" :position="isLR ? Position.Right : Position.Bottom" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_DIRECTION, TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { PoolNodeData } from '@/modules/topology/types/topology.types.ts'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: PoolNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
const isLR = inject(TOPOLOGY_DIRECTION, 'TB') === 'LR'
</script>

<style scoped lang="postcss">
.pool-node {
  background: var(--color-brand-background-selected);
  border: 0.2rem solid var(--color-brand-item-base);
  border-radius: 0.8rem;
  padding: 1.2rem 1.6rem;
  min-width: 24rem;

  &.dir-tb {
    padding-bottom: 2rem;
  }

  &.dir-lr {
    padding-right: 2.5rem;
  }
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

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.8rem;
      height: 2.8rem;
      border-radius: 50%;
      background: var(--color-brand-background-selected);
      flex-shrink: 0;

      :root.dark & {
        background: color-mix(in srgb, var(--color-brand-item-base) 20%, transparent);
      }

      .node-icon {
        font-size: 1.2rem;
        color: var(--color-brand-item-base);
      }
    }

    .node-title {
      font-weight: 600;
      font-size: 1.3rem;
      color: var(--color-neutral-txt-primary);
      text-decoration: none;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      &:hover {
        color: var(--color-brand-item-hover);
      }
    }
  }

  .node-info {
    margin-top: 0.6rem;
    font-size: 1.1rem;
    color: var(--color-neutral-txt-secondary);
  }

  .node-running {
    margin-top: 0.4rem;

    .running-pill {
      display: inline-block;
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--color-success-item-base);
      background: var(--color-success-background-selected);
      padding: 0.1rem 0.8rem;
      border-radius: 10rem;

      :root.dark & {
        background: color-mix(in srgb, var(--color-success-item-base) 20%, transparent);
      }
    }
  }
}
</style>
