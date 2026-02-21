<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node sr-node" :class="borderClass">
    <Handle type="target" :position="Position.Left" />
    <div class="node-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="faHardDrive" class="node-icon" />
      </span>
      <span class="node-title">{{ data.sr.name_label }}</span>
    </div>
    <div class="node-info">
      <span class="badge badge-type">{{ data.srType }}</span>
      <span class="badge" :class="data.shared ? 'badge-shared' : 'badge-local'">
        {{ data.shared ? 'Shared' : 'Local' }}
      </span>
      <span class="info-item">{{ data.pbdHostCount }} {{ data.pbdHostCount === 1 ? 'host' : 'hosts' }}</span>
    </div>
    <div class="node-vm-info">
      <span class="info-item">{{ data.vmCount }} {{ data.vmCount === 1 ? 'VM' : 'VMs' }}</span>
      <span v-if="data.runningVmCount > 0" class="badge badge-running">{{ data.runningVmCount }} running</span>
    </div>
    <div v-if="data.size > 0" class="usage-bar">
      <VtsProgressBar :current="data.usage" :total="data.size" label="Usage" legend-type="percent" noruler />
    </div>
    <NodeExpandButton
      v-if="data.isExpandable"
      :expanded="data.isExpanded"
      @toggle="toggleExpand?.(`sr-${data.sr.id}`)"
    />
    <Handle v-else type="source" :position="Position.Right" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { SrNodeData } from '@/modules/topology/types/topology.types.ts'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import { faHardDrive } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { computed, inject } from 'vue'

const { data } = defineProps<{ data: SrNodeData }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)

const borderClass = computed(() => (data.allAttached ? 'border-ok' : 'border-danger'))
</script>

<style scoped lang="postcss">
.sr-node {
  background: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
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

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 0.3rem;
    height: 100%;
    border-radius: 0.8rem 0 0 0.8rem;
  }

  &.border-ok::before {
    background: var(--color-success-item-base);
  }

  &.border-danger::before {
    background: var(--color-danger-item-base);
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
      background: color-mix(in srgb, #f59e0b 15%, transparent);
      color: #f59e0b;
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

  .node-vm-info {
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

  .badge-type {
    color: #f59e0b;
    background: color-mix(in srgb, #f59e0b 15%, transparent);
  }

  .badge-shared {
    color: #3b82f6;
    background: color-mix(in srgb, #3b82f6 15%, transparent);
  }

  .badge-local {
    color: var(--color-neutral-txt-secondary);
    background: var(--color-neutral-background-secondary);
  }

  .badge-running {
    color: var(--color-success-item-base);
    background: color-mix(in srgb, var(--color-success-item-base) 15%, transparent);
  }

  .usage-bar {
    margin-top: 0.6rem;
  }
}
</style>
