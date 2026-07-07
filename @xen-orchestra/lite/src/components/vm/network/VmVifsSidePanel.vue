<template>
  <VtsSidePanel :has-selection="!!vif" @close="emit('close')">
    <template v-if="vif" #default>
      <!-- VIF -->
      <UiCard class="card">
        <VtsCardObjectTitle :id="vif.uuid" :label="t('vif')" />
        <div class="content">
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network') }}
            </template>
            <template #value>{{ network?.name_label }}</template>
            <template v-if="network?.name_label" #addons>
              <VtsCopyButton :value="network.name_label" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEVICE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('device') }}
            </template>
            <template #value>
              {{ t('vif-device', { device: vif.device }) }}
            </template>
            <template #addons>
              <VtsCopyButton :value="vif.device" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VIF STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('vif-status') }}
            </template>
            <template #value>
              <VtsStatus :status />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('mtu') }}
            </template>
            <template #value>
              {{ vif.MTU }}
            </template>
            <template #addons>
              <VtsCopyButton :value="String(vif.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('locking-mode') }}
            </template>
            <template #value>
              {{ vif.locking_mode }}
            </template>
          </VtsCardRowKeyValue>
          <!-- TODO Need to add TX Checksumming -->
        </div>
      </UiCard>
      <!-- VIF NETWORK INFORMATION -->
      <UiCard class="card">
        <UiCardTitle>{{ t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- IP ADDRESSES -->
          <div v-if="ipAddresses.length">
            <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
              <template #key>
                <div v-if="index === 0">{{ t('ip-addresses') }}</div>
              </template>
              <template #value>{{ ip }}</template>
              <template #addons>
                <VtsCopyButton :value="ip" />
                <VtsCopyAllMenuItem v-if="index === 0 && ipAddresses.length > 0" :values="ipAddresses" />
              </template>
            </VtsCardRowKeyValue>
          </div>
          <VtsCardRowKeyValue v-else>
            <template #key>
              {{ t('ip-addresses') }}
            </template>
            <template #value>
              <span class="value" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MAC ADDRESSES -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('mac-address') }}
            </template>
            <template #value>
              {{ vif.MAC }}
            </template>
            <template #addons>
              <VtsCopyButton :value="vif.MAC" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{
  vif?: XenApiVif
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()

const ipAddresses = computed(() => {
  if (vif === undefined) {
    return []
  }

  const vm = getVmByOpaqueRef(vif.VM)

  if (!vm) {
    return []
  }

  const networks = getGuestMetricsByOpaqueRef(vm.guest_metrics)?.networks

  return getUniqueIpAddressesForDevice(networks, vif.device)
})

const network = computed(() => (vif !== undefined ? getNetworkByOpaqueRef(vif.network) : undefined))

const status = computed(() => (vif?.currently_attached ? 'connected' : 'disconnected'))
</script>

<style scoped lang="postcss">
.card {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
