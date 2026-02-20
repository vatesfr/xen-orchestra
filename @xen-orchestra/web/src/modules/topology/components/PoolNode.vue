<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node pool-node">
    <Handle type="target" :position="Position.Top" />
    <div class="node-header">
      <FontAwesomeIcon :icon="faCity" class="node-icon" />
      <RouterLink :to="{ name: '/pool/[id]', params: { id: data.pool.id } }" class="node-title">
        {{ data.pool.name_label }}
      </RouterLink>
    </div>
    <div class="node-info">
      {{ data.hostCount }} {{ data.hostCount === 1 ? 'node' : 'nodes' }}, {{ data.vmCount }} VMs
    </div>
    <div class="node-running">
      <span class="running-badge">{{ data.runningVmCount }} running</span>
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(`pool-${data.pool.id}`)"
    />
    <Handle v-else type="source" :position="Position.Bottom" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { PoolNodeData } from '@/modules/topology/types/topology.types.ts'
import { faCity } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: PoolNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
</script>

<style lang="postcss" scoped>
.pool-node {
  background: var(--color-neutral-background-primary);
  border: 0.2rem solid var(--color-brand-item-base);
  border-radius: 0.8rem;
  padding: 1.2rem 1.6rem;
  padding-bottom: 2rem;
  min-width: 24rem;
  position: relative;

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .node-icon {
      color: var(--color-brand-item-base);
    }

    .node-title {
      font-weight: 600;
      font-size: 1.3rem;
      color: var(--color-neutral-txt-primary);
      text-decoration: none;

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

    .running-badge {
      font-size: 1.1rem;
      color: var(--color-success-item-base);
      font-weight: 500;
    }
  }
}
</style>
