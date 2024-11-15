<template>
  <UiPanel class="pool-network-side-panel">
    <VtsNoSelectionHero v-if="!network" type="panel" />
    <template #header>
      <UiButton disabled variant="tertiary" size="medium" accent="info" :left-icon="faEdit">{{ $t('edit') }}</UiButton>
      <UiButton disabled variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
      <UiButtonIcon disabled accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <div class="card-container">
      <UiCard v-if="network">
        <UiCardTitle class="typo p1-medium">
          <p v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">{{ network.name_label }}</p>
        </UiCardTitle>
        <div>
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('id') }}
            </template>
            <template #value>
              {{ network.id }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="info"
                @click="copy(network.id)"
              />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('description') }}
            </template>
            <template #value>
              {{ network.name_description }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="info"
                @click="copy(network.name_description)"
              />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue v-if="pifs.length > 0 && pifs[0].vlan">
            <template #key>
              {{ $t('vlan') }}
            </template>
            <template #value>
              {{ getNetworkVlan(pifs[0].vlan) }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="info"
                @click="copy(getNetworkVlan(pifs[0].vlan))"
              />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('mtu') }}
            </template>
            <template #value>
              {{ network.MTU }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="info"
                @click="copy(String(network.MTU))"
              />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('network-block-device') }}
            </template>
            <template #value>
              {{ nbd }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="info"
                @click="copy(String(network.nbd))"
              />
            </template>
          </VtsCardRowKeyValue>
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('locking-mode-default') }}
            </template>
            <template #value>
              {{ lockingMode }}
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <UiCard v-if="network && network.PIFs && network.PIFs.length > 0">
        <div class="typo p1-medium">
          {{ $t('pifs') }}
          <UiCounter :value="selectedPIFsLength" variant="primary" size="small" accent="neutral" />
        </div>
        <table class="simple-table">
          <thead>
            <tr>
              <th class="text-left typo p3-regular text-ellipsis host">
                {{ $t('host') }}
              </th>
              <th class="text-left typo p3-regular text-ellipsis">
                {{ $t('device') }}
              </th>
              <th class="text-left typo p3-regular text-ellipsis">
                {{ $t('pifs-status') }}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <PifRow v-for="pif in pifs" :key="pif.id" :pif />
          </tbody>
        </table>
      </UiCard>
    </div>
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { records: networks } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()

const networkId = useRouteQuery('id')

const network = computed(() => networks.value.find(network => network.id === networkId.value))

const pifs = computed(() => {
  if (!network.value) {
    return []
  }

  return pifsByNetwork.value.get(network.value.id) || []
})

const selectedPIFsLength = computed(() => pifs.value.length.toString())

const { copy, copied } = useClipboard()

const getNetworkVlan = (vlan: XoPif['vlan']) => {
  return vlan !== -1 ? vlan.toString() : t('none')
}

const lockingMode = computed(() => (network.value?.default_locking_mode ? t('disabled') : t('unlocked')))

const nbd = computed(() => (network.value?.nbd ? t('on') : t('off')))
</script>

<style scoped lang="postcss">
.pool-network-side-panel {
  width: 40rem;
  border-top: none;

  .card-container {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    cursor: default;
    position: sticky;
    top: 1rem;

    .text-left {
      text-align: left;
    }

    .simple-table {
      border-spacing: 0;
    }
  }
}
</style>
