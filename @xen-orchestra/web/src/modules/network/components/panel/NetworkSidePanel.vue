<template>
  <VtsSidePanel :has-selection="!!network" @close="emit('close')">
    <template v-if="network" #actions>
      <VtsDeleteButton :busy="isDeletingNetwork" @click="openDeleteModal()" />
    </template>
    <template v-if="network" #default>
      <UiCard class="card-container">
        <VtsCardObjectTitle :id="network.id" :label="network.name_label" icon="object:network" :href="networkHref" />
        <div class="content">
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
        </div>
      </UiCard>
      <NetworkPifsInfoCard :network />
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import NetworkPifsInfoCard from '@/modules/network/components/panel/cards/NetworkPifsInfoCard.vue'
import { useNetworkDeleteModal } from '@/modules/network/composables/use-network-delete-modal.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network?: FrontXoNetwork
}>()

const emit = defineEmits<{
  close: []
}>()

const { openModal: openDeleteModal, isRunning: isDeletingNetwork } = useNetworkDeleteModal(() =>
  network !== undefined ? [network] : []
)

const { buildXo5Route } = useXoRoutes()

const networkHref = computed(() =>
  network !== undefined ? buildXo5Route(`/pools/${network.$pool}/network?s=1_0_asc-${network.id}`) : undefined
)

const { getPifsByNetworkId } = useXoPifCollection()

const { t } = useI18n()

const pifs = computed(() => (network !== undefined ? getPifsByNetworkId(network.id) : []))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return
  }

  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
})

const networkNbd = computed(() => (network?.nbd ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() => (network?.defaultIsLocked ? t('disabled') : t('unlocked')))
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value:empty::before {
      content: '-';
    }
  }
}
</style>
