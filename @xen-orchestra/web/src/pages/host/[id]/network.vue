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
          :selected-items="selected.length"
          :total-items="usableRefs.length"
          @toggle-select-all="toggleSelect"
        />
        <VtsTable vertical-border class="table">
          <thead>
            <tr>
              <ColumnTitle id="checkbox">
                <UiCheckbox accent="info" />
              </ColumnTitle>
              <ColumnTitle id="network" :icon="faAlignLeft">{{ $t('network') }}</ColumnTitle>
              <ColumnTitle id="device" :icon="faAlignLeft">{{ $t('device') }}</ColumnTitle>
              <ColumnTitle id="status" :icon="faPowerOff">{{ $t('status') }}</ColumnTitle>
              <ColumnTitle id="vlan" :icon="faAlignLeft">{{ $t('vlan') }}</ColumnTitle>
              <ColumnTitle id="ipAddresses" :icon="faAt">{{ $t('ip-addresses') }}</ColumnTitle>
              <ColumnTitle id="macAddress" :icon="faAt">{{ $t('mac-address') }}</ColumnTitle>
              <ColumnTitle id="ipMode" :icon="faCaretDown">{{ $t('ip-mode') }}</ColumnTitle>
              <ColumnTitle id="more" :icon="faEllipsis" />
            </tr>
          </thead>
          <tbody>
            <tr v-for="pif in pifs" :key="pif.id">
              <VtsCellText>
                <UiCheckbox accent="info" />
              </VtsCellText>
              <VtsCellObject>
                <UiObjectLink :route="`/vm/${pif.data.id}/console`">
                  <template #icon>
                    <UiComplexIcon size="medium">
                      <VtsIcon :icon="faNetworkWired" accent="current" />
                      <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                    </UiComplexIcon>
                  </template>
                  {{ pif.data.name_label }}
                </UiObjectLink>
              </VtsCellObject>
              <VtsCellText>{{ pif.data.device }}</VtsCellText>
              <VtsCellObject>
                <VtsIcon
                  :accent="getStatusProps(pif.data.status as NetworkStatus).accent"
                  :icon="faCircle"
                  :overlay-icon="getStatusProps(pif.data.status as NetworkStatus).icon"
                />
                <div class="pif-status">{{ pif.data.status }}</div>
              </VtsCellObject>
              <VtsCellText>{{ pif.data.vlan }}</VtsCellText>
              <VtsCellText>{{ pif.data.ip }}</VtsCellText>
              <VtsCellText>{{ pif.data.mac }}</VtsCellText>
              <VtsCellText>{{ pif.data.ip_mode }}</VtsCellText>
              <VtsCellText>
                <VtsIcon accent="info" :icon="faEllipsis" />
              </VtsCellText>
            </tr>
          </tbody>
        </VtsTable>
        <UiTopBottomTable
          class="selection"
          :selected-items="selected.length"
          :total-items="usableRefs.length"
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
      <UiCard />
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
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { defineTree } from '@core/composables/tree/define-tree'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import useMultiSelect from '@core/composables/table/multi-select.composable'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import { useTree } from '@core/composables/tree.composable'
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
  },
]

const { filter, predicate } = useTreeFilter()

const definitions = defineTree(data, {
  getLabel: 'name_label',
  predicate,
})
const { filter } = useTreeFilter()
const usableRefs = computed(() => data.map(item => item.id))
const { selected, areAllSelected } = useMultiSelect(usableRefs)

const { nodes: pifs } = useTree(definitions, { expand: false })

const totalItems = ref(data)

const toggleSelect = () => {
  selected.value = selected.value.length === 0 ? usableRefs.value : []
}

// const { nodes: pifs } = useTree(definitions, { expand: false })
type NetworkStatus = 'connected' | 'disconnected' | 'other'

type NetworkAccent = 'success' | 'warning' | 'danger'

const states: Record<NetworkStatus, { icon: IconDefinition; accent: NetworkAccent }> = {
  connected: { icon: faCheck, accent: 'success' },
  disconnected: { icon: faCheck, accent: 'danger' },
  other: { icon: faExclamation, accent: 'warning' },
}

const getStatusProps = (status: NetworkStatus) => states[status as NetworkStatus]
</script>

<style scoped lang="postcss">
.miss-component {
  padding: 1.6rem;
  margin: 0.8rem;
  border: solid 0.1rem var(--color-neutral-border);
  border-radius: 0.8rem;
  text-align: center;
  background-color: lightblue;
}

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

    .table {
      margin-top: 2.4rem;
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
}
</style>
ø]
