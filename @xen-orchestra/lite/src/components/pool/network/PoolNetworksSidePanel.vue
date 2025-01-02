<template>
  <UiPanel v-if="selectedNetwork">
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
    <UiCard v-if="selectedNetwork" class="card-container">
      <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
        {{ selectedNetwork.network.name_label }}
      </UiCardTitle>
      <div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('uuid') }}</div>
          <div class="value text-ellipsis">{{ getDisplayValue(selectedNetwork.network.uuid) }}</div>
          <UiButtonIcon
            v-if="selectedNetwork.network.uuid"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard(selectedNetwork.network.uuid)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('description') }}</div>
          <div class="value text-ellipsis">{{ getDisplayValue(selectedNetwork.network.name_description) }}</div>
          <UiButtonIcon
            v-if="selectedNetwork.network.name_description"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard(selectedNetwork.network.name_description)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('vlan') }}</div>
          <div class="value">{{ getDisplayValue(selectedNetwork.vlan) }}</div>
          <UiButtonIcon
            v-if="selectedNetwork.vlan"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard(selectedNetwork.vlan)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('mtu') }}</div>
          <div class="value">{{ getDisplayValue(selectedNetwork.network.MTU) }}</div>
          <UiButtonIcon
            v-if="selectedNetwork.network.MTU"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard(selectedNetwork.network.MTU)"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('network-block-device') }}</div>
          <div class="value">{{ getDisplayValue(selectedNetwork.network.purpose[0]) }}</div>
          <UiButtonIcon
            v-if="selectedNetwork.network.purpose[0]"
            accent="info"
            size="medium"
            :icon="faCopy"
            @click="copyToClipboard(selectedNetwork.network.purpose[0])"
          />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('locking-mode-default') }}</div>
          <div class="value">{{ getDisplayValue(selectedNetwork.network.default_locking_mode) }}</div>
        </div>
      </div>
    </UiCard>
    <UiCard v-if="selectedNetwork?.network?.PIFs?.length > 0" class="card-container">
      <div class="typo p1-medium">
        {{ $t('pifs') }}
        <UiCounter :value="selectedPifsLength" variant="primary" size="small" accent="neutral" />
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
          <tr v-for="selected in selectedPifs" :key="selected.PIF.uuid">
            <td class="typo p3-regular host">
              <UiObjectIcon :state="selected?.host?.hostStatus ? 'running' : 'disabled'" type="host" size="small" />
              <a>
                {{ selected?.host?.name_label }}
              </a>
            </td>
            <td class="typo p3-regular device">
              {{ selected.PIF.device }}
            </td>
            <td class="typo p3-regular status">
              <VtsConnectionStatus :status="selected.status" />
            </td>
            <td class="text-right">
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
import type { Status } from '@/types/status'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
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
    network: XenApiNetwork
    status?: Status
    vlan?: string
  }
  selectedPifs?: {
    PIF: XenApiPif
    status: Status
    host?: {
      name_label?: string
      hostStatus?: boolean
    }
  }[]
}>()

const selectedPifsLength = computed(() => selectedPifs?.length.toString())

const getDisplayValue = (value?: string | number): string => {
  return value ? String(value) : '-'
}

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

  .content {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .title {
      color: var(--color-neutral-txt-secondary);
      min-width: 14rem;
    }

    .value {
      color: var(--color-neutral-txt-primary);
      width: 20rem;
    }
  }

  .text-left {
    text-align: left;
  }

  .text-right {
    text-align: right;
  }

  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    td.host {
      width: 13rem;
      max-width: 13rem;
    }

    td.device {
      width: 6rem;
      max-width: 6rem;
    }

    td.status {
      width: 14rem;
      max-width: 14rem;
    }

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
