<template>
  <UiPanel v-if="selectedNetwork">
    <template #header>
      <UiButton variant="tertiary" size="medium" accent="info" :left-icon="faEdit">{{ $t('edit') }}</UiButton>
      <UiButton variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">{{ $t('delete') }}</UiButton>
      <UiButtonIcon accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <UiCard v-if="selectedNetwork" class="card-container">
      <div v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
        {{ (selectedNetwork as any)?.network.name_label }}
      </div>
      <div>
        <div class="typo p3-regular content-details">
          <div class="title">{{ $t('uuid') }}</div>
          <div class="value text-ellipsis">{{ (selectedNetwork as any)?.network.uuid }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.uuid)"
          />
        </div>
        <div class="typo p3-regular content-details">
          <div class="title">{{ $t('description') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.name_description }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.name_description)"
          />
        </div>
        <div v-if="(selectedNetwork as any)?.vlan" class="typo p3-regular content-details">
          <div class="title">{{ $t('vlan') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.vlan }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
        </div>
        <div class="typo p3-regular content-details">
          <div class="title">{{ $t('mtu') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.MTU }}</div>
          <UiButtonIcon
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.MTU)"
          />
        </div>
        <div v-if="(selectedNetwork as any)?.network.purpose[0]" class="typo p3-regular content-details">
          <div class="title">{{ $t('network-block-device') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.purpose[0] }}</div>
          <UiButtonIcon
            v-if="(selectedNetwork as any)?.network.purpose[0]"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard((selectedNetwork as any)?.network.purpose[0])"
          />
        </div>
        <div class="typo p3-regular content-details">
          <div class="title">{{ $t('locking-mode-default') }}</div>
          <div class="value">{{ (selectedNetwork as any)?.network.default_locking_mode }}</div>
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
            <th class="text-left typo p3-regular">
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
          <tr v-for="selected in selectedPifs" :key="selected.PIF.uuid">
            <td class="typo p3-regular">
              <UiObjectIcon :state="selected?.host?.hostStatus ? 'running' : 'disabled'" type="host" size="small" />
              {{ selected?.host?.name_label }}
            </td>
            <td class="typo p3-regular">{{ selected.PIF.device }}</td>
            <td class="typo p3-regular">
              <UiInfo v-if="selected.PIF.currently_attached" accent="success"> {{ $t('connected') }}</UiInfo>
              <UiInfo v-else-if="!selected.PIF.currently_attached" accent="danger"> {{ $t('disconnected') }}</UiInfo>
              <UiInfo v-else accent="warning"> {{ $t('partially-connected') }}</UiInfo>
            </td>
            <td>
              <UiButtonIcon size="small" accent="info" :icon="faAngleRight" />
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight, faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { selectedPifs, selectedNetwork } = defineProps<{
  selectedNetwork?: {
    network: XenApiNetwork
    status?: string
    selected?: boolean
    vlan?: string
  }
  selectedPifs?: {
    PIF: XenApiPif
    host?: {
      name_label?: string
      hostStatus?: boolean
    }
  }[]
}>()

const selectedPIFsLength = computed(() => selectedPifs?.length.toString())

const copyToClipboard = (text: string | number) => {
  const stringText = String(text)
  navigator.clipboard.writeText(stringText)
}
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content-details {
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
  }

  .simple-table {
    thead tr th {
      color: var(--color-neutral-txt-secondary);
    }

    tbody tr td {
      color: var(--color-neutral-txt-primary);
    }
  }
}
</style>
