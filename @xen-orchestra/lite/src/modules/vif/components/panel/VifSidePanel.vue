<template>
  <VtsSidePanel :has-selection="!!vif" class="vm-vifs-side-panel" @close="emit('close')">
    <template v-if="vif" #actions>
      <VifEditButton :vif />
      <VifConnectionToggleButton v-if="vm" :vif :vm />
    </template>
    <template v-if="vif" #default>
      <!-- VIF -->
      <UiPanelCard>
        <UiPanelCardTitle :id="vif.uuid" size="medium" :to="vifTo" :label="t('vif')" icon="object:vif" />
        <div class="content">
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network') }}
            </template>
            <template #value>
              <UiLink v-if="network" size="medium" :to="networkTo" icon="object:network">
                {{ network.name_label }}
              </UiLink>
            </template>
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
          <!-- RATE LIMIT -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('rate-limit') }}
            </template>
            <template #value>
              {{ rateLimit !== undefined ? `${rateLimit} ${t('bytes:kbs')}` : '' }}
            </template>
          </VtsCardRowKeyValue>
          <!-- LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('locking-mode') }}
            </template>
            <template #value>
              {{ lockingModeLabel }}
            </template>
          </VtsCardRowKeyValue>
          <!-- TX CHECK SUMMING -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('check-summing') }}
            </template>
            <template #value>
              {{ isTxChecksummingEnabled(vif) }}
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiPanelCard>
      <!-- VIF NETWORK INFORMATION -->
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('network-information')" />
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
                <VtsCopyAllMenuItem v-if="index === 0 && ipAddresses.length > 1" :values="ipAddresses" />
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
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/network.util.ts'
import VifConnectionToggleButton from '@/modules/vif/components/actions/connection/VifConnectionToggleButton.vue'
import VifEditButton from '@/modules/vif/components/actions/edit/VifEditButton.vue'
import { isTxChecksummingEnabled } from '@/modules/vif/utils/vif-tx-checksumming.util.ts'
import { getVifRateLimit, getVifRoute } from '@/modules/vif/utils/vif.util.ts'
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyAllMenuItem from '@core/components/copy-all-menu-item/VtsCopyAllMenuItem.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { useVifLockingModeLabel } from '@core/utils/vif.util.ts'
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
const vm = computed(() => (vif !== undefined ? getVmByOpaqueRef(vif.VM) : undefined))

const vifTo = computed(() => (vif !== undefined ? getVifRoute(vif.uuid) : undefined))

const lockingModeLabel = useVifLockingModeLabel(() => vif?.locking_mode)

const ipAddresses = computed(() => {
  if (vif === undefined) {
    return []
  }

  if (!vm.value) {
    return []
  }

  const networks = getGuestMetricsByOpaqueRef(vm.value.guest_metrics)?.networks

  return getUniqueIpAddressesForDevice(networks, vif.device)
})

const network = computed(() => (vif !== undefined ? getNetworkByOpaqueRef(vif.network) : undefined))

const { pool } = usePoolStore().subscribe()

const networkTo = computed(() =>
  pool.value && network.value ? getPoolNetworkRoute(pool.value.uuid, network.value.uuid) : undefined
)

const status = computed(() => (vif?.currently_attached ? 'connected' : 'disconnected'))

const rateLimit = computed(() => (vif !== undefined ? getVifRateLimit(vif) : undefined))
</script>

<style scoped lang="postcss">
.vm-vifs-side-panel {
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
