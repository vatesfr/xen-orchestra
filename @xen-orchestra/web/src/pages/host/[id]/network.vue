<template>
  <div class="host-network-view">
    <div class="host-network-table-container">
      <UiTitle type="h4" class="header">
        <slot>{{ $t('pifs') }}</slot>
        <template #actions>
          <UiButton size="medium" variant="secondary" accent="info" :left-icon="faArrowsRotate">
            {{ $t('scan-pifs') }}
          </UiButton>
        </template>
      </UiTitle>
      <div v-if="isReady" class="table-container">
        <UiQuerySearchBar class="table-query" @search="(value: string) => (filter = value)" />
        <UiTableActions>
          <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit" disabled>
            {{ $t('edit') }}
          </UiButton>
          <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faTrash" disabled>
            {{ $t('delete') }}
          </UiButton>
          <template #title>
            <UiActionsTitle> {{ $t('table-actions') }}</UiActionsTitle>
          </template>
        </UiTableActions>
        <UiTopBottomTable
          class="selection"
          :selected-items="selectedItems"
          :total-items="pifs.length"
          @toggle-select-all="toggleSelect"
        />
        <VtsTable vertical-border class="table">
          <thead>
            <tr>
              <ColumnTitle id="checkbox">
                <UiCheckbox accent="info" @update:model-value="toggleSelect($event)" />
              </ColumnTitle>
              <ColumnTitle id="network" :icon="faAlignLeft">{{ $t('network') }}</ColumnTitle>
              <ColumnTitle id="device" :icon="faAlignLeft">{{ $t('device') }}</ColumnTitle>
              <ColumnTitle id="status" :icon="faPowerOff">{{ $t('status') }}</ColumnTitle>
              <ColumnTitle id="vlan" :icon="faAlignLeft">{{ $t('vlan') }}</ColumnTitle>
              <ColumnTitle id="ipAddresses" :icon="faAt">{{ $t('ip-addresses') }}</ColumnTitle>
              <ColumnTitle id="macAddress" :icon="faAt">{{ $t('mac-address') }}</ColumnTitle>
              <ColumnTitle id="ipMode" :icon="faCaretDown">{{ $t('ip-mode') }}</ColumnTitle>
              <ColumnTitle id="more">
                <UiButtonIcon :icon="faEllipsis" size="medium" accent="info" />
              </ColumnTitle>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pif in pifs" :key="pif.uuid">
              <VtsCellText>
                <UiCheckbox v-model="pif.selected" accent="info" />
              </VtsCellText>
              <VtsCellText>
                <UiObjectLink>
                  <template #icon>
                    <UiComplexIcon size="medium">
                      <VtsIcon :icon="faNetworkWired" accent="current" />
                      <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                    </UiComplexIcon>
                  </template>
                  {{ pif.networkLabel }}
                </UiObjectLink>
              </VtsCellText>
              <VtsCellText>{{ pif.device }}</VtsCellText>
              <VtsCellObject>
                <VtsIcon
                  :accent="getStatusProps(status(pif) as NetworkStatus).accent"
                  :icon="faCircle"
                  :overlay-icon="getStatusProps(status(pif) as NetworkStatus).icon"
                />
                <div class="pif-status">{{ getStatusProps(status(pif) as NetworkStatus).text }}</div>
              </VtsCellObject>
              <VtsCellText>{{ pif.vlan }}</VtsCellText>
              <VtsCellText>{{ pif.ip }}</VtsCellText>
              <VtsCellText>{{ pif.mac }}</VtsCellText>
              <VtsCellText>{{ pif.mode }}</VtsCellText>
              <VtsCellText class="status-icon">
                <UiButtonIcon :icon="faEllipsis" size="medium" accent="info" />
              </VtsCellText>
            </tr>
          </tbody>
        </VtsTable>
        <UiTopBottomTable
          class="selection"
          :selected-items="selectedItems"
          :total-items="pifsByHost.length"
          @toggle-select-all="toggleSelect"
        />
      </div>
    </div>
    <UiPanel v-if="isReady" class="network-panel">
      <template #header>
        <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
          {{ $t('edit') }}
        </UiButton>
        <UiButton size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
          {{ $t('delete') }}
        </UiButton>
      </template>
      <UiCard class="card">
        <UiCardTitle>{{ $t('pif') }}</UiCardTitle>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('uuid') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].uuid }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('network') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].networkLabel }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('device') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].device }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('pif-status') }}</p>
          <VtsIcon
            :accent="getStatusProps(status(selectedPif[0]) as NetworkStatus).accent"
            :icon="faCircle"
            :overlay-icon="getStatusProps(status(selectedPif[0]) as NetworkStatus).icon"
          />
          <p class="typo p3-regular">{{ getStatusProps(status(selectedPif[0]) as NetworkStatus).text }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('physical-interface-status') }}</p>
          <VtsIcon
            :accent="getStatusProps(status(selectedPif[0]) as NetworkStatus).accent"
            :icon="faCircle"
            :overlay-icon="getStatusProps(status(selectedPif[0]) as NetworkStatus).icon"
          />
          <p class="typo p3-regular">{{ getStatusProps(status(selectedPif[0]) as NetworkStatus).text }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('vlan') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].vlan }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('tags') }}</p>
          <div class="tags">
            <UiTag v-for="tag in selectedPif[0].tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </div>
        </div>
      </UiCard>
      <UiCard class="card">
        <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('ip-addresses') }}</p>
          <p v-for="ip in selectedPif[0].allIps" :key="ip" class="ip-address typo p3-regular">{{ ip }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('mac-addresses') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].mac }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('netmask') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].netmask }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('dns') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].dns }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('gateway') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].gateway }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('ip-mode') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].mode }}</p>
        </div>
      </UiCard>
      <UiCard class="card">
        <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('mtu') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].mtu }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('speed') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].speed }} {{ $t('mbs') }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('network-blocking-device') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].nbd }}</p>
        </div>
        <div class="card-content">
          <p class="title typo p3-regular">{{ $t('default-locking-mode') }}</p>
          <p class="typo p3-regular">{{ selectedPif[0].defaultLockingMode }}</p>
        </div>
      </UiCard>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoPif } from '@/types/xo/pif.type'
import VtsCellObject from '@core/components/cell-object/VtsCellObject.vue'
import VtsCellText from '@core/components/cell-text/VtsCellText.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faAlignLeft,
  faArrowsRotate,
  faAt,
  faCaretDown,
  faCheck,
  faCircle,
  faEdit,
  faEllipsis,
  faExclamation,
  faNetworkWired,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const { pifsByHost, isReady } = useNetworkStore().subscribe()

const { filter } = useTreeFilter()

const pifs = computed(() => pifsByHost.value.map(pif => ({ ...pif })))
const selectedPif = computed(() => pifs.value as XoPif[])

type NetworkStatus = 'connected' | 'disconnected' | 'other'
type NetworkAccent = 'success' | 'warning' | 'danger'

const states: Record<NetworkStatus, { text: string; icon: IconDefinition; accent: NetworkAccent }> = {
  connected: { text: 'Connected', icon: faCheck, accent: 'success' },
  disconnected: { text: 'Disconnected', icon: faCheck, accent: 'danger' },
  other: { text: 'Disconnected from physical device', icon: faExclamation, accent: 'warning' },
}
const status = (pif: XoPif) => {
  if (pif.attached && pif.carrier) {
    return 'connected'
  }
  if (pif.attached && !pif.carrier) {
    return 'other'
  }
  return 'disconnected'
}

const getStatusProps = (status: NetworkStatus) => states[status as NetworkStatus]
const selectedItems = computed(() => pifsByHost.value.filter(item => item.selected).length)

const toggleSelect = (isSelected: boolean) => {
  pifs.value.forEach(item => {
    item.selected = isSelected
  })
}
</script>

<style scoped lang="postcss">
.host-network-view {
  display: flex;
  height: 100%;

  .host-network-table-container {
    height: fit-content;
    padding: 1.6rem;
    margin: 0.8rem;
    border: solid 0.1rem var(--color-neutral-border);
    border-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);
  }

  .table-container {
    margin-top: 2.4rem;

    .selection {
      margin: 0.8rem 0;
    }
  }

  .network-panel {
    min-width: 400px;
    border-top: none;
  }

  .pif-status {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card {
    gap: 0.8rem;
  }

  .card-content {
    width: 100%;
    display: flex;
    gap: 1.8rem;
  }

  .title {
    min-width: 12rem;
    overflow-wrap: break-word;
  }

  .description {
    display: flex;
    justify-content: space-between;
    width: 100%;
    overflow: hidden;
    gap: 0.8rem;

    & > p {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    &.ip {
      display: unset;
    }
  }

  .action-buttons {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }

  .ip-address {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .tags {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }
}
</style>
