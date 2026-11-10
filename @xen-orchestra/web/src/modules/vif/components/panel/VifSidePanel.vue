<template>
  <VtsSidePanel :has-selection="!!vif" class="vif-side-panel" @close="emit('close')">
    <template v-if="vif" #actions>
      <VifConnectionToggleButton :vif :vm />
      <VifDeleteButton :vif />
    </template>
    <template v-if="vif" #default>
      <!-- VIF -->
      <UiPanelCard>
        <UiPanelCardTitle :id="vif.id" size="medium" :to="vifTo" :label="t('vif')" icon="object:vif" />
        <VtsCardRowList>
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network') }}
            </template>
            <template #value>
              <UiLink v-if="network" size="small" :to="networkTo" icon="object:network">
                {{ network.name_label }}
              </UiLink>
            </template>
            <template v-if="network" #addons>
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
              {{ vif.rateLimit !== undefined ? `${vif.rateLimit} ${t('bytes:kbs')}` : '' }}
            </template>
          </VtsCardRowKeyValue>
          <!-- LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('locking-mode') }}
            </template>
            <template #value>
              {{ vif.lockingMode }}
            </template>
          </VtsCardRowKeyValue>
          <!-- TX CHECK SUMMING -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('check-summing') }}
            </template>
            <template #value>
              {{ vif.txChecksumming }}
            </template>
          </VtsCardRowKeyValue>
        </VtsCardRowList>
      </UiPanelCard>
      <!-- NETWORK INFORMATION -->
      <UiPanelCard>
        <UiPanelCardTitle size="medium" :label="t('network-information')" />
        <VtsCardRowList>
          <!-- IP ADDRESSES -->
          <VtsCardRowKeyValue :values="ipAddresses">
            <template #key>{{ t('ip-addresses') }}</template>
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
        </VtsCardRowList>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import VifConnectionToggleButton from '@/modules/vif/components/actions/connection/VifConnectionToggleButton.vue'
import VifDeleteButton from '@/modules/vif/components/actions/delete/VifDeleteButton.vue'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { getVifTrafficRoute } from '@/modules/vif/utils/xo-vif.util.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { CONNECTION_STATUS } from '@core/types/connection.ts'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif, vm } = defineProps<{
  vif?: FrontXoVif
  vm: FrontXoVm
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { useGetNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()

const vifTo = computed(() => (vif !== undefined ? getVifTrafficRoute(vif.id) : undefined))

const ipAddresses = computed(() => {
  if (vif === undefined) {
    return []
  }

  const addresses = getVmById(vif.$VM)?.addresses

  return getUniqueIpAddressesForDevice(addresses, vif.device)
})

const network = useGetNetworkById(() => vif?.$network)

const networkTo = computed(() =>
  network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
)

const status = computed(() => (vif?.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED))
</script>

<style scoped lang="postcss">
.vif-side-panel {
  .value:empty::before {
    content: '-';
  }
}
</style>
