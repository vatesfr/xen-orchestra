<template>
  <div class="load-balancer-distribution-host">
    <div class="header">
      <div class="host-identity">
        <VtsIcon name="object:host" size="medium" />
        <span class="name typo-body-semi-bold">{{ host.name_label }}</span>
      </div>
      <div class="bars">
        <VtsProgressBar
          :current="host.memory.usage"
          :total="host.memory.size"
          legend-type="bytes-with-total"
          :label="t('ram')"
          noruler
        />
        <VtsProgressBar
          :current="allocatedVcpus"
          :total="hostCpuCores"
          legend-type="value-with-total"
          :label="t('vcpus')"
          noruler
        />
      </div>
    </div>
    <div class="vm-list">
      <div v-for="vm of hostVms" :key="vm.id" class="vm-item">
        <VtsIcon :name="objectIcon('vm', toLower(vm.power_state))" size="medium" />
        <span class="vm-name">{{ vm.name_label }}</span>
        <span class="vm-memory typo-body-regular-small">{{ formatSize(vm.memory.size, 1) }}</span>
        <LoadBalancerTagsList :tags="vm.tags" />
      </div>
      <div v-if="hostVms.length === 0" class="no-vms typo-body-regular-small">
        {{ t('load-balancer:no-vms-on-host') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import LoadBalancerTagsList from '@/modules/load-balancer/components/LoadBalancerTagsList.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsProgressBar from '@core/components/progress-bar/VtsProgressBar.vue'
import { objectIcon } from '@core/icons'
import { formatSize } from '@core/utils/size.util.ts'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host, vms } = defineProps<{
  host: FrontXoHost
  vms: FrontXoVm[]
}>()

const { t } = useI18n()

const hostVms = computed(() => vms.filter(vm => vm.$container === host.id))

const allocatedVcpus = computed(() => hostVms.value.reduce((sum, vm) => sum + vm.CPUs.number, 0))

const hostCpuCores = computed(() => {
  if (host.cpus.cores !== undefined && host.cpus.sockets !== undefined) {
    return host.cpus.cores * host.cpus.sockets
  }

  const cpuCount = Number(host.CPUs?.cpu_count)

  if (!isNaN(cpuCount) && cpuCount > 0) {
    return cpuCount
  }

  return 64
})
</script>

<style lang="postcss" scoped>
.load-balancer-distribution-host {
  padding: 1.6rem;
  border-bottom: 1px solid var(--color-neutral-border);

  &:last-child {
    border-bottom: none;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 2.4rem;
    margin-bottom: 1.2rem;
  }

  .host-identity {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }

  .bars {
    display: flex;
    gap: 2.4rem;
    flex: 1;
  }

  .vm-list {
    display: flex;
    flex-direction: column;
    padding-inline-start: 1.6rem;
  }

  .vm-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.4rem 0;
    min-height: 4.8rem;
    border-bottom: 1px solid var(--color-neutral-border);

    &:last-child {
      border-bottom: none;
    }
  }

  .vm-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vm-memory {
    color: var(--color-neutral-txt-secondary);
    white-space: nowrap;
  }

  .no-vms {
    color: var(--color-neutral-txt-secondary);
    font-style: italic;
  }
}
</style>
