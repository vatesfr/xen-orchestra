<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node site-node" :class="isLR ? 'dir-lr' : 'dir-tb'">
    <div class="node-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faSatellite" class="node-icon" />
      </span>
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-stats">
      <span class="stat">{{ data.poolCount }} {{ data.poolCount === 1 ? 'pool' : 'pools' }}</span>
      <span class="stat">{{ data.hostCount }} {{ data.hostCount === 1 ? 'host' : 'hosts' }}</span>
      <span class="stat">{{ data.vmCount }} VMs</span>
    </div>
    <NodeExpandButton v-if="data.isExpandable" :expanded="data.isExpanded" @toggle="toggleExpand?.(SITE_NODE_ID)" />
    <Handle v-else type="source" :position="isLR ? Position.Right : Position.Bottom" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_DIRECTION, TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { SiteNodeData } from '@/modules/topology/types/topology.types.ts'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: SiteNodeData }>()

const SITE_NODE_ID = 'site-root'

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
const isLR = inject(TOPOLOGY_DIRECTION, 'TB') === 'LR'
</script>

<style scoped lang="postcss">
.site-node {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-brand-item-base) 85%, transparent),
    color-mix(in srgb, var(--color-brand-item-hover) 75%, transparent)
  );
  backdrop-filter: blur(1.2rem);
  color: var(--color-brand-txt-item);
  border: 0.1rem solid color-mix(in srgb, var(--color-brand-item-base) 40%, transparent);
  border-radius: 0.8rem;
  padding: 1.2rem 1.6rem;
  min-width: 26rem;

  &.dir-tb {
    padding-bottom: 2rem;
  }

  &.dir-lr {
    padding-right: 2.5rem;
  }
  box-shadow: var(--shadow-200);
  position: relative;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-300);
    transform: translateY(-0.2rem);
  }

  :root.dark & {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-brand-item-base) 60%, transparent),
      color-mix(in srgb, var(--color-brand-item-base) 40%, transparent)
    );
    border-color: color-mix(in srgb, var(--color-brand-item-base) 30%, transparent);
    box-shadow: 0 0.2rem 0.8rem rgba(255, 255, 255, 0.06);

    &:hover {
      box-shadow: 0 0.4rem 1.4rem rgba(255, 255, 255, 0.1);
    }
  }

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 600;
    font-size: 1.4rem;

    .icon-circle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.8rem;
      height: 2.8rem;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      flex-shrink: 0;

      .node-icon {
        font-size: 1.2rem;
      }
    }
  }

  .node-stats {
    display: flex;
    gap: 1.2rem;
    margin-top: 0.8rem;
    font-size: 1.2rem;
    opacity: 0.85;

    .stat {
      white-space: nowrap;
    }
  }
}
</style>
