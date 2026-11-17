<template>
  <VtsSidePanel :has-selection="!!network" class="network-side-panel" @close="emit('close')">
    <template v-if="network" #actions>
      <VtsDeleteButton :busy="isDeletingNetworks" @click="deleteNetworks()" />
    </template>
    <template v-if="network" #default>
      <UiPanelCard>
        <UiPanelCardTitle
          :id="network.id"
          size="medium"
          :label="network.name_label"
          icon="object:network"
          :to="networkTo"
        />
        <VtsCardRowList class="content">
          <!-- DESCRIPTION -->
          <VtsCardRowKeyValue truncate align-top>
            <template #key>{{ t('description') }}</template>
            <template #value>
              {{ network.name_description }}
            </template>
            <template v-if="network.name_description" #addons>
              <VtsCopyButton :value="network.name_description" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VLAN -->
          <VtsCardRowKeyValue v-if="networkVlan">
            <template #key>{{ t('vlan') }}</template>
            <template #value>{{ networkVlan }}</template>
            <template #addons>
              <VtsCopyButton :value="String(networkVlan)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('mtu') }}</template>
            <template #value>
              <span>
                {{ network.MTU }}
              </span>
            </template>
            <template #addons>
              <VtsCopyButton :value="String(network.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NBD -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('network-block-device') }}</template>
            <template #value>{{ networkNbd }}</template>
            <template #addons>
              <VtsCopyButton :value="networkNbd" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEFAULT LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('locking-mode-default') }}</template>
            <template #value>{{ networkDefaultLockingMode }}</template>
          </VtsCardRowKeyValue>
        </VtsCardRowList>
      </UiPanelCard>
      <NetworkPifsInfoCard :network />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import NetworkPifsInfoCard from '@/modules/network/components/panel/cards/NetworkPifsInfoCard.vue'
import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import { useXoNetworkUtils } from '@/modules/network/composables/xo-network-utils.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network?: FrontXoNetwork
}>()

const emit = defineEmits<{
  close: []
}>()

const { deleteNetworks, isDeletingNetworks } = useNetworkDelete(() => (network !== undefined ? [network] : []))

const networkTo = computed(() => (network !== undefined ? getNetworkRoute(network.id) : undefined))

const { t } = useI18n()

const { networkVlan, networkNbd, networkDefaultLockingMode } = useXoNetworkUtils(() => network)
</script>

<style scoped lang="postcss">
.network-side-panel {
  .content {
    .value:empty::before {
      content: '-';
    }
  }
}
</style>
