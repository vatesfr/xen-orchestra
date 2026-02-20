<!-- eslint-disable @intlify/vue-i18n/no-raw-text -- prototype: i18n keys to be added later -->
<template>
  <div class="topology-node vm-group-node">
    <Handle type="target" :position="Position.Top" />
    <div class="vm-icon">
      <FontAwesomeIcon :icon="faDesktop" />
    </div>
    <div class="vm-counts">
      <span v-if="data.runningCount > 0" class="count running">{{ data.runningCount }} running</span>
      <span v-if="data.stoppedCount > 0" class="count stopped">{{ data.stoppedCount }} stopped</span>
    </div>
    <div class="vm-total">{{ data.vms.length }} VMs</div>
  </div>
</template>

<script lang="ts" setup>
import type { VmGroupNodeData } from '@/modules/topology/types/topology.types.ts'
import { faDesktop } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { Handle, Position } from '@vue-flow/core'

defineProps<{ data: VmGroupNodeData }>()
</script>

<style lang="postcss" scoped>
.vm-group-node {
  background: var(--color-neutral-background-secondary);
  border: 0.1rem dashed var(--color-neutral-border);
  border-radius: 0.6rem;
  padding: 0.8rem 1.2rem;
  text-align: center;
  min-width: 16rem;

  .vm-icon {
    color: var(--color-neutral-txt-secondary);
    font-size: 1.4rem;
    margin-bottom: 0.4rem;
  }

  .vm-counts {
    display: flex;
    justify-content: center;
    gap: 0.8rem;
    font-size: 1.1rem;

    .count {
      font-weight: 600;

      &.running {
        color: var(--color-success-item-base);
      }

      &.stopped {
        color: var(--color-danger-txt-base);
      }
    }
  }

  .vm-total {
    margin-top: 0.2rem;
    font-size: 1rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
