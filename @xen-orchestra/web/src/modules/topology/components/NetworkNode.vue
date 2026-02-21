<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node network-node">
    <Handle type="target" :position="Position.Left" />
    <div class="node-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faNetworkWired" class="node-icon" />
      </span>
      <span class="node-title">{{ data.network.name_label }}</span>
    </div>
    <div class="node-info">
      <span class="info-item">{{ data.vmCount }} {{ data.vmCount === 1 ? 'VM' : 'VMs' }}</span>
      <span v-if="data.runningVmCount > 0" class="badge badge-running">{{ data.runningVmCount }} running</span>
      <span class="info-item">on {{ data.pifHostCount }} {{ data.pifHostCount === 1 ? 'host' : 'hosts' }}</span>
    </div>
    <div class="node-meta">
      <span class="info-item">MTU {{ data.mtu }}</span>
      <span class="badge" :class="data.hasPhysicalPifs ? 'badge-physical' : 'badge-internal'">
        {{ data.hasPhysicalPifs ? 'Physical' : 'Internal' }}
      </span>
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(`net-${data.network.id}`)"
    />
    <Handle v-else type="source" :position="Position.Right" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { NetworkNodeData } from '@/modules/topology/types/topology.types.ts'
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: NetworkNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
</script>

<style scoped lang="postcss">
.network-node {
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-left: 0.3rem solid #3b82f6;
  border-radius: 0.8rem;
  padding: 1rem 1.4rem;
  padding-right: 2.5rem;
  min-width: 24rem;
  position: relative;
  box-shadow: var(--shadow-200);
  transition:
    box-shadow 0.3s ease,
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
    gap: 0.6rem;

    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 50%;
      background: color-mix(in srgb, #3b82f6 15%, transparent);
      color: #3b82f6;
      flex-shrink: 0;

      .node-icon {
        font-size: 1rem;
      }
    }

    .node-title {
      font-weight: 500;
      font-size: 1.2rem;
      color: var(--color-neutral-txt-primary);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.6rem;
    flex-wrap: wrap;
  }

  .node-meta {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.4rem;
    flex-wrap: wrap;
  }

  .info-item {
    font-size: 1.1rem;
    color: var(--color-neutral-txt-secondary);
    white-space: nowrap;
  }

  .badge {
    display: inline-block;
    font-size: 1rem;
    font-weight: 500;
    padding: 0.1rem 0.6rem;
    border-radius: 10rem;
    white-space: nowrap;
  }

  .badge-running {
    color: var(--color-success-item-base);
    background: color-mix(in srgb, var(--color-success-item-base) 15%, transparent);
  }

  .badge-physical {
    color: #3b82f6;
    background: color-mix(in srgb, #3b82f6 15%, transparent);
  }

  .badge-internal {
    color: var(--color-neutral-txt-secondary);
    background: var(--color-neutral-background-secondary);
  }
}
</style>
