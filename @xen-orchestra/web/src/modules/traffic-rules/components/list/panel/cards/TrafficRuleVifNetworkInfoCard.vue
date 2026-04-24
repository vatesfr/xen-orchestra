<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('vif-network-info') }}</UiCardTitle>
    <div class="content">
      <template v-if="ipAddresses.length">
        <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip" align-top>
          <template #key>
            <div v-if="index === 0">{{ t('ip-addresses') }}</div>
          </template>
          <template #value>{{ ip }}</template>
          <template #addons>
            <VtsCopyButton :value="ip" />
            <UiButtonIcon
              v-if="index === 0 && ipAddresses.length > 1"
              v-tooltip="t('coming-soon!')"
              disabled
              icon="fa:ellipsis"
              size="small"
              accent="brand"
            />
          </template>
        </VtsCardRowKeyValue>
      </template>
      <VtsCardRowKeyValue v-else>
        <template #key>
          {{ t('ip-addresses') }}
        </template>
        <template #value>
          <span class="value" />
        </template>
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
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
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
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}

.value:empty::before {
  content: '-';
}
</style>
