<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node empty-group-node" :class="isLR ? 'dir-lr' : 'dir-tb'">
    <Handle type="target" :position="isLR ? Position.Left : Position.Top" />
    <div class="group-header">
      <span class="icon-circle">
        <FontAwesomeIcon :icon="data.kind === 'network' ? faNetworkWired : faHardDrive" class="group-icon" />
      </span>
      <span class="group-label">
        {{ data.items.length }} unused {{ data.kind === 'network' ? 'networks' : 'SRs' }}
      </span>
    </div>
    <div v-if="data.isExpanded" class="item-list">
      <div v-for="item in data.items" :key="item.id" class="item-row">
        <span class="item-dot" />
        <span class="item-name">{{ item.name }}</span>
      </div>
    </div>
    <NodeExpandButton v-if="data.isExpandable" :expanded="data.isExpanded" @toggle="toggleExpand?.(id)" />
  </div>
</template>

<script lang="ts" setup>
import NodeExpandButton from '@/modules/topology/components/NodeExpandButton.vue'
import { TOPOLOGY_DIRECTION, TOPOLOGY_TOGGLE_EXPAND } from '@/modules/topology/composables/use-topology-interaction.ts'
import type { EmptyGroupNodeData } from '@/modules/topology/types/topology.types.ts'
import { faHardDrive, faNetworkWired } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'
import { inject } from 'vue'

defineProps<{ data: EmptyGroupNodeData; id: string }>()

const toggleExpand = inject(TOPOLOGY_TOGGLE_EXPAND, undefined)
const isLR = inject(TOPOLOGY_DIRECTION, 'TB') === 'LR'
</script>

<style scoped lang="postcss">
.empty-group-node {
  background: var(--color-neutral-background-secondary);
  border: 0.1rem dashed var(--color-neutral-border);
  border-radius: 0.6rem;
  padding: 0.6rem 1rem;
  min-width: 18rem;
  max-width: 24rem;
  overflow: visible;
  position: relative;
  opacity: 0.75;
  box-shadow: var(--shadow-100);
  transition:
    box-shadow 0.2s ease,
    opacity 0.2s ease;

  &:hover {
    opacity: 1;
    box-shadow: var(--shadow-200);
  }

  &.dir-tb {
    padding-bottom: 2rem;
  }

  &.dir-lr {
    padding-right: 2.5rem;
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .icon-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-neutral-background-disabled);
    flex-shrink: 0;

    :root.dark & {
      background: color-mix(in srgb, var(--color-neutral-txt-secondary) 15%, transparent);
    }

    .group-icon {
      color: var(--color-neutral-txt-secondary);
      font-size: 0.8rem;
    }
  }

  .group-label {
    font-size: 1.1rem;
    font-weight: 500;
    color: var(--color-neutral-txt-secondary);
    white-space: nowrap;
  }

  .item-list {
    margin-top: 0.4rem;
    border-top: 0.1rem solid var(--color-neutral-border);
    padding-top: 0.3rem;
    display: flex;
    flex-direction: column;
  }

  .item-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
    min-width: 0;

    .item-dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--color-neutral-txt-secondary);
      flex-shrink: 0;
      opacity: 0.5;
    }

    .item-name {
      font-size: 1rem;
      color: var(--color-neutral-txt-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
