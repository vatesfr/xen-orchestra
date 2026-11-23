<template>
  <UiPanelCard class="traffic-rule-vif-network-info-card">
    <UiPanelCardTitle size="medium" :label="t('vif-network-info')" />
    <VtsCardRowList class="content">
      <VtsCardRowKeyValue :values="ipAddresses" align-top>
        <template #key>{{ t('ip-addresses') }}</template>
      </VtsCardRowKeyValue>
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

<script setup lang="ts">
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
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
.traffic-rule-vif-network-info-card {
  .content {
    .value:empty::before {
      content: '-';
    }
  }
}
</style>
