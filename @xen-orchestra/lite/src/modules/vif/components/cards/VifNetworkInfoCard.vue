<template>
  <UiCard>
    <UiTitle>
      {{ t('vif-network-info') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('ip-addresses')">
        <template v-if="ipAddresses.length" #value>
          <div class="ip-list">
            <span v-for="ip in ipAddresses" :key="ip">{{ ip }}</span>
          </div>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('mac-address')" :value="vif.MAC" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: XenApiVif }>()

const { t } = useI18n()

const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()

const ipAddresses = computed(() => {
  const vm = getVmByOpaqueRef(vif.VM)

  if (vm === undefined) {
    return []
  }

  return getUniqueIpAddressesForDevice(getGuestMetricsByOpaqueRef(vm.guest_metrics)?.networks, vif.device)
})
</script>

<style scoped lang="postcss">
.ip-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
