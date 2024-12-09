<template>
  <UiPanel v-if="selectedNetwork" class="pool-network-side-panel">
    <template #header>
      <UiButton variant="tertiary" size="medium" accent="info" :left-icon="faEdit">{{ $t('edit') }}</UiButton>
      <UiButton variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">{{ $t('delete') }}</UiButton>
      <UiButtonIcon accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <UiCard v-if="selectedNetwork" class="card-container">
      <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
        {{ (selectedNetwork as any)?.network.name_label }}
      </UiCardTitle>
      <div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('id') }}</div>
          <div class="value text-ellipsis">{{ (selectedNetwork as any)?.network.id }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.id)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('description') }}</div>
          <div class="value text-ellipsis">{{ (selectedNetwork as any)?.network.name_description }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.name_description)"
          />
        </div>
        <div v-if="(selectedNetwork as any)?.vlan" class="typo p3-regular content">
          <div class="title">{{ $t('vlan') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.vlan }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('mtu') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.MTU }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.MTU)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('network-block-device') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.nbd }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.nbd)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('locking-mode-default') }}</div>
          <div class="value default-locking">{{ (selectedNetwork as any)?.network.default_locking_mode }}</div>
        </div>
      </div>
    </UiCard>
    <UiCard
      v-if="
        selectedNetwork.network &&
        (selectedNetwork as any)?.network.PIFs &&
        (selectedNetwork as any)?.network.PIFs.length > 0
      "
      class="card-container"
    >
      <div class="typo p1-medium">
        {{ $t('pifs') }}
        <UiCounter :value="selectedPIFsLength" variant="primary" size="small" accent="neutral" />
      </div>
      <table class="simple-table">
        <thead>
          <tr>
            <th class="text-left typo p3-regular text-ellipsis">
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
          <tr v-for="pif in selectedPifs" :key="pif.id">
            <td class="typo p3-regular text-ellipsis">
              <UiObjectIcon :state="getHost(pif.$host).power_state ? 'running' : 'disabled'" type="host" size="small" />
              <a>
                {{ getHost(pif.$host)!.name_label }}
              </a>
            </td>
            <td class="typo p3-regular">{{ pif.device }}</td>
            <td class="typo p3-regular">
              <PifStatus :pif />
            </td>
            <td>
              <UiButtonIcon size="small" accent="info" :icon="faAngleRight" />
            </td>
          </tr>
          <!--          <tr v-for="selected in selectedPifs" :key="selected.PIF.id"> -->
          <!--            <td class="typo p3-regular"> -->
          <!--              <UiObjectIcon :state="selected?.host?.hostStatus ? 'running' : 'disabled'" type="host" size="small" /> -->
          <!--              <a> -->
          <!--                {{ selected?.host?.name_label }} -->
          <!--              </a> -->
          <!--            </td> -->
          <!--            <td class="typo p3-regular"> -->
          <!--              {{ selected.PIF.device }} -->
          <!--            </td> -->
          <!--            <td class="typo p3-regular"> -->
          <!--              <UiInfo v-if="selected.PIF.attached" accent="success"> {{ $t('connected') }}</UiInfo> -->
          <!--              <UiInfo v-else-if="!selected.PIF.attached" accent="danger"> {{ $t('disconnected') }}</UiInfo> -->
          <!--              <UiInfo v-else accent="warning"> {{ $t('partially-connected') }}</UiInfo> -->
          <!--            </td> -->
          <!--            <td> -->
          <!--              <UiButtonIcon size="small" accent="info" :icon="faAngleRight" /> -->
          <!--            </td> -->
          <!--          </tr> -->
        </tbody>
      </table>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight, faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'

import { computed } from 'vue'

const { selectedPifs, selectedNetwork } = defineProps<{
  selectedNetwork?: {
    network: XoNetwork
    status?: string
    selected?: boolean
    vlan?: string
  }
  selectedPifs?: XoPif[]
}>()

const { records } = useHostStore().subscribe()

const selectedPIFsLength = computed(() => selectedPifs!.length.toString())
const copyToClipboard = (text: string | number) => {
  const stringText = String(text)
  navigator.clipboard.writeText(stringText)
}
const getHost = id => {
  return records.value.find(host => host.id === id)
}
</script>

<style scoped lang="postcss">
.pool-network-side-panel {
  width: 40rem;
  border-top: none;

  .card-container {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;

    .content {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      .title {
        color: var(--color-neutral-txt-secondary);
        min-width: 12rem;
      }

      .value {
        color: var(--color-neutral-txt-primary);
        width: 20rem;
      }

      .default-locking {
        width: 23rem;
      }
    }

    .text-left {
      text-align: left;
    }

    .simple-table {
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
}
</style>
