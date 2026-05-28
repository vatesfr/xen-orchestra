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
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { getUniqueIpAddressesForDevice } from '@core/utils/ip-address.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: FrontXoVif }>()

const { t } = useI18n()

const { getVmById } = useXoVmCollection()

const ipAddresses = computed(() => {
  const addresses = getVmById(vif.$VM)?.addresses

  return getUniqueIpAddressesForDevice(addresses, vif.device)
})
</script>

<style scoped lang="postcss">
.ip-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
