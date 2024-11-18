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
      <div class="table-container">
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
          :total-items="totalItems.length"
          @toggle-select-all="toggleSelect"
        />
        <VtsTable vertical-border class="table">
          <thead>
            <tr>
              <ColumnTitle id="checkbox">
                <UiCheckbox :v-model="test" accent="info" @update:model-value="toggleSelect($event)" />
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
            <tr v-for="pif in totalItems" :key="pif.id">
              <VtsCellText>
                <UiCheckbox v-model="pif.selected" accent="info" />
              </VtsCellText>
              <VtsCellObject>
                <UiObjectLink :route="`/vm/${pif.id}/console`">
                  <template #icon>
                    <UiComplexIcon size="medium">
                      <VtsIcon :icon="faNetworkWired" accent="current" />
                      <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                    </UiComplexIcon>
                  </template>
                  {{ pif.name_label }}
                </UiObjectLink>
              </VtsCellObject>
              <VtsCellText>{{ pif.device }}</VtsCellText>
              <VtsCellObject>
                <VtsIcon
                  :accent="getStatusProps(pif.status as NetworkStatus).accent"
                  :icon="faCircle"
                  :overlay-icon="getStatusProps(pif.status as NetworkStatus).icon"
                />
                <div class="pif-status">{{ pif.status }}</div>
              </VtsCellObject>
              <VtsCellText>{{ pif.vlan }}</VtsCellText>
              <VtsCellText>{{ pif.ip }}</VtsCellText>
              <VtsCellText>{{ pif.mac }}</VtsCellText>
              <VtsCellText>{{ pif.ip_mode }}</VtsCellText>
              <VtsCellText class="status-icon">
                <UiButtonIcon :icon="faEllipsis" size="medium" accent="info" />
              </VtsCellText>
            </tr>
          </tbody>
        </VtsTable>
        <UiTopBottomTable
          class="selection"
          :selected-items="selectedItems"
          :total-items="totalItems.length"
          @toggle-select-all="toggleSelect"
        />
      </div>
    </div>
    <UiPanel class="network-panel">
      <template #header>
        <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
          {{ $t('edit') }}
        </UiButton>
        <UiButton size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
          {{ $t('delete') }}
        </UiButton>
      </template>
      <UiCard v-for="card in cardsContent" :key="card.name" class="card">
        <UiCardTitle>{{ card.name }}</UiCardTitle>
        <div v-for="(value, key) in card.content" :key="key" class="card-content">
          <p class="title typo p3-regular">{{ key }}</p>
          <div v-if="key === 'network'">
            <UiComplexIcon size="medium">
              <VtsIcon :icon="faNetworkWired" accent="current" />
              <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
            </UiComplexIcon>
          </div>
          <div v-if="key === 'status' || key === 'physicalStatus'" class="status-icon">
            <VtsIcon
              :accent="getStatusProps(value as NetworkStatus).accent"
              :icon="faCircle"
              :overlay-icon="getStatusProps(value as NetworkStatus).icon"
            />
          </div>
          <div v-if="key === 'ip_addresses'" class="description ip typo p3-regular">
            <div v-for="(ip, index) in value" :key="ip" class="ip-address">
              <p>{{ ip }}</p>
              <div class="action-buttons">
                <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
                <UiButtonIcon v-if="index === 0" :icon="faEllipsis" size="medium" accent="info" />
              </div>
            </div>
          </div>
          <div v-else-if="key === 'tags'" class="tags">
            <UiTag v-for="tag in value" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </div>
          <div v-else class="description typo p3-regular">
            <p>{{ value }}</p>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </div>
        </div>
      </UiCard>
    </UiPanel>
  </div>
</template>

<script setup lang="ts">
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
// import { defineTree } from '@core/composables/tree/define-tree'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
// import { useTree } from '@core/composables/tree.composable'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import {
  faAlignLeft,
  faArrowsRotate,
  faAt,
  faCaretDown,
  faCheck,
  faCircle,
  faCopy,
  faEdit,
  faEllipsis,
  faExclamation,
  faNetworkWired,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref } from 'vue'

const data = [
  {
    id: 'e8ec9a13-7b65-495e-2d90-224c17e02b67',
    name_label: '[Team XCPng] - Win X centers',
    status: 'connected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: 'e40c1da3-918b-c173-506c-e8c2c069181f',
    name_label: 'AS-YA test VM pharpp_2023-10-30T15:03:17.071Z',
    status: 'connected',
    device: 'eth1',
    vlan: 101,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: '989cd0ad-17f8-c198-15c6-8549da1f3b9f',
    name_label: 'BRS - XenServer 8',
    status: 'disconnected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: 'bfbacbd4-8a09-c769-4e7e-59c2a0f77095',
    name_label: 'Debian Teddy',
    status: 'other',
    device: 'eth1',
    vlan: null,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: '03a631e2-a39e-7c63-7bb3-ac7a5ef6c47e',
    name_label: 'DML - 8.2.1 - Host 1',
    status: 'connected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'Static',
    selected: false,
  },
  {
    id: 'ea57eb75-c55b-d9c9-6cb4-e0ea235eb16f',
    name_label: 'ElasticSearch FMD',
    status: 'disconnected',
    device: 'eth1',
    vlan: 102,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: '559b0b63-2173-b6a1-ef65-7155d56401b6',
    name_label: 'flo-ubuntu',
    status: 'connected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: '99e196e1-33f9-461b-93e3-d70a0eb29b3e',
    name_label: 'Test BRS',
    status: 'disconnected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'Static',
    selected: false,
  },
  {
    id: 'cd418934-1f70-22bc-688e-eb6da266aa57',
    name_label: 'XCP-ng 8.2.1 UEFI Ext (TEe)',
    status: 'connected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'DHCP',
    selected: false,
  },
  {
    id: '6d9c33fc-ebec-240d-e31b-18152911795d',
    name_label: 'XCP-ng 8.3 A1 Lyon - BRS',
    status: 'connected',
    device: 'eth1',
    vlan: 100,
    ip: '127.0.0.1',
    mac: '00:1A:2B:3C:4D:5E',
    ip_mode: 'Static',
    selected: false,
  },
]
const cardsContent = [
  {
    name: 'PIF',
    content: {
      uuid: '71df26a2-678a-49c7-8232-8ebcac4987ab',
      network: data[0].name_label,
      device: data[0].device,
      status: data[0].status,
      physicalStatus: data[0].status,
      vlan: data[0].vlan,
      tags: ['prod', 'QA'],
    },
  },
  {
    name: 'Network Info',
    content: {
      ip_addresses: ['fe80::1a2b:3c4d:5f', '255.255.255.0', '255.255.255.0', '255.255.255.0', '255.255.255.0'],
      mac_addresses: '00:1A:2B:3C:4D:5E',
      netmask: '255.255.255.0',
      dns: '8.8.8.8',
      gateway: '192.168.1.1',
      ip_mode: data[0].ip_mode,
    },
  },
  {
    name: 'Properties',
    content: {
      mtu: '1500',
      speed: '1000 Mb/s',
      network_block_device: 'Off',
      default_locking_mode: 'True',
    },
  },
]

const { filter } = useTreeFilter()

// const definitions = defineTree(data, {
//   getLabel: 'name_label',
//   predicate,
// })

const totalItems = ref(data)

// const { nodes: pifs } = useTree(definitions, { expand: false })

type NetworkStatus = 'connected' | 'disconnected' | 'other'
type NetworkAccent = 'success' | 'warning' | 'danger'

const states: Record<NetworkStatus, { icon: IconDefinition; accent: NetworkAccent }> = {
  connected: { icon: faCheck, accent: 'success' },
  disconnected: { icon: faCheck, accent: 'danger' },
  other: { icon: faExclamation, accent: 'warning' },
}

const getStatusProps = (status: NetworkStatus) => states[status as NetworkStatus]
const selectedItems = computed(() => totalItems.value.filter(item => item.selected).length)

const toggleSelect = (isSelected: boolean) => {
  totalItems.value.forEach(item => {
    item.selected = isSelected
  })
}
const test = () => {
  return false
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
