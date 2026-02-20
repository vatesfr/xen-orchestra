<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node site-node">
    <div class="node-header">
      <FontAwesomeIcon :icon="faSatellite" class="node-icon" />
      <span class="node-title">{{ data.label }}</span>
    </div>
    <div class="node-stats">
      <span class="stat">{{ data.poolCount }} {{ data.poolCount === 1 ? 'pool' : 'pools' }}</span>
      <span class="stat">{{ data.hostCount }} {{ data.hostCount === 1 ? 'host' : 'hosts' }}</span>
      <span class="stat">{{ data.vmCount }} VMs</span>
    </div>
    <Handle type="source" :position="Position.Bottom" />
  </div>
</template>

<script lang="ts" setup>
import type { SiteNodeData } from '@/modules/topology/types/topology.types.ts'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: SiteNodeData }>()
</script>

<style lang="postcss" scoped>
.site-node {
  background: var(--color-brand-item-base);
  color: var(--color-brand-txt-item);
  border-radius: 0.8rem;
  padding: 1.2rem 1.6rem;
  min-width: 26rem;
  box-shadow: 0 0.4rem 1.2rem color-mix(in srgb, var(--color-brand-item-base) 30%, transparent);

  .node-header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    font-weight: 600;
    font-size: 1.4rem;
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
