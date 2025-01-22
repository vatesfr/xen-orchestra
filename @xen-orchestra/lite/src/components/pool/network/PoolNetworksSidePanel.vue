<template>
  <UiPanel class="pool-network-side-panel">
    <VtsNoSelectionHero v-if="!network" type="panel" />
    <template #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="info"
        :left-icon="faEdit"
      >
        {{ $t('edit') }}
      </UiButton>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ $t('delete') }}
      </UiButton>
      <UiButtonIcon accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <UiCard v-if="network" class="card-container">
      <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
        {{ network.name_label }}
      </UiCardTitle>
      <div class="content">
        <!-- UUID -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>{{ formatValue(network.uuid) }}</template>
          <template #addons>
            <UiButtonIcon
              v-if="network.uuid"
              v-tooltip="copied && $t('core.copied')"
              accent="info"
              size="medium"
              :icon="faCopy"
              @click="copy(network.uuid)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- DESCRIPTION -->
        <VtsCardRowKeyValue>
          <template #key>{{ $t('description') }}</template>
          <template #value>{{ formatValue(network.name_description) }}</template>
          <template #addons>
            <UiButtonIcon
              v-if="network.name_description"
              v-tooltip="copied && $t('core.copied')"
              accent="info"
              size="medium"
              :icon="faCopy"
              @click="copy(network.name_description)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- VLAN -->
        <VtsCardRowKeyValue>
          <template #key>{{ $t('vlan') }}</template>
          <template #value>{{ formatValue(getNetworkVlan(network)) }}</template>
          <template #addons>
            <UiButtonIcon
              v-if="getNetworkVlan(network)"
              v-tooltip="copied && $t('core.copied')"
              accent="info"
              size="medium"
              :icon="faCopy"
              @click="copy(String(getNetworkVlan(network)))"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- MTU -->
        <VtsCardRowKeyValue>
          <template #key>{{ $t('mtu') }}</template>
          <template #value>{{ formatValue(network.MTU) }}</template>
          <template #addons>
            <UiButtonIcon
              v-if="network.MTU"
              v-tooltip="copied && $t('core.copied')"
              accent="info"
              size="medium"
              :icon="faCopy"
              @click="copy(String(network.MTU))"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- NBD -->
        <VtsCardRowKeyValue>
          <template #key>{{ $t('network-block-device') }}</template>
          <template #value>{{ formatValue(network.purpose[0]) }}</template>
          <template #addons>
            <UiButtonIcon
              v-if="network.purpose[0]"
              v-tooltip="copied && $t('core.copied')"
              accent="info"
              size="medium"
              :icon="faCopy"
              @click="copy(network.purpose[0])"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- DEFAULT LOCKING MODE -->
        <VtsCardRowKeyValue>
          <template #key>{{ $t('locking-mode-default') }}</template>
          <template #value>{{ formatValue(network.default_locking_mode) }}</template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard v-if="network && network?.PIFs?.length > 0" class="card-container">
      <div class="typo p1-medium">
        {{ $t('pifs') }}
        <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
      </div>
      <table class="simple-table">
        <thead>
          <tr>
            <th class="text-left typo p3-regular host">
              {{ $t('host') }}
            </th>
            <th class="text-left typo p3-regular">
              {{ $t('device') }}
            </th>
            <th class="text-left typo p3-regular">
              {{ $t('pifs-status') }}
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <PifRow v-for="pif in pifs" :key="pif.uuid" :pif />
        </tbody>
      </table>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
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

const { records: networks } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()

const networkId = useRouteQuery('id')
const network = computed(() => networks.value.find(network => network.uuid === networkId.value))

const pifs = computed(() => (network.value ? pifsByNetwork.value.get(network.value.$ref) || [] : []))

const getNetworkVlan = computed(() => (network: XenApiNetwork): string | undefined => {
  const networkPIFs = pifs.value.filter(pif => network.PIFs.includes(pif.$ref))
  if (networkPIFs.length > 0) {
    return networkPIFs[0].VLAN !== -1 ? networkPIFs[0].VLAN.toString() : ''
  }
})
const pifsCount = computed(() => pifs.value.length.toString())
const formatValue = computed(() => (value?: string | number): string => {
  return value ? String(value) : '-'
})
const { copy, copied } = useClipboard()
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
  }

  .text-left {
    text-align: left;
  }

  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    tbody tr {
      cursor: pointer;

      &:hover {
        background-color: var(--color-info-background-hover);
      }
    }

    thead tr th {
      color: var(--color-neutral-txt-secondary);
    }

    tbody tr td {
      color: var(--color-neutral-txt-primary);
    }

    tbody tr td a {
      margin-left: 0.8rem;
      text-decoration: underline solid #6b63bf;
    }
  }
}
</style>
