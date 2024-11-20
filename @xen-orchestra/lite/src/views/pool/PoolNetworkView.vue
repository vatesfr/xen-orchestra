<template>
  <div class="pool-network-view">
    <UiCard class="card">
      <div class="networks-content">
        <UiTitle>
          {{ $t('network') }}
          <template #actions>
            <UiButton :left-icon="faPlus" variant="secondary" accent="info" size="medium">{{ $t('new') }}</UiButton>
          </template>
        </UiTitle>
        <UiQuerySearchBar />
        <UiTableActions title="Table actions">
          <UiButton :left-icon="faEdit" variant="tertiary" accent="info" size="medium">{{ $t('edit') }}</UiButton>
          <UiButton :left-icon="faTrash" variant="tertiary" accent="danger" size="medium">{{ $t('delete') }}</UiButton>
        </UiTableActions>
        <div>
          <UiTopBottomTable
            :selected-items="selectedItemsNetwork"
            :total-items="reactiveNetworksWithVLANs.length"
            @toggle-select-all="toggleSelectNetwork"
          />
          <VtsTable>
            <thead>
              <tr>
                <th class="checkbox-header">
                  <UiCheckbox accent="info" @update:model-value="toggleSelectNetwork($event)" />
                </th>
                <ColumnTitle id="name" :icon="faAlignLeft">{{ $t('name') }}</ColumnTitle>
                <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('description') }}</ColumnTitle>
                <ColumnTitle id="pifs" :icon="faPowerOff">{{ $t('pifs-status') }}</ColumnTitle>
                <ColumnTitle id="vlan" :icon="faAlignLeft">{{ $t('vlan') }}</ColumnTitle>
                <ColumnTitle id="mtu" :icon="faHashtag">{{ $t('mtu') }}</ColumnTitle>
                <ColumnTitle id="locking" :icon="faCaretDown">{{ $t('locking-mode') }}</ColumnTitle>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in reactiveNetworksWithVLANs" :key="index">
                <td>
                  <UiCheckbox v-model="item.selected" accent="info" />
                </td>
                <td>{{ item.name_label }}</td>
                <td>{{ item.name_description }}</td>
                <td>
                  <!-- TODO improvement required -->
                  <UiInfo v-if="item.status === 'connected'" accent="success"> {{ item.status }}</UiInfo>
                  <UiInfo v-else-if="item.status === 'disconnected'" accent="danger"> {{ item.status }}</UiInfo>
                  <UiInfo v-else accent="warning"> {{ item.status }}</UiInfo>
                </td>
                <td>{{ item.vlan }}</td>
                <td>{{ item.MTU }}</td>
                <td>{{ item.default_locking_mode }}</td>
              </tr>
            </tbody>
          </VtsTable>
          <UiTopBottomTable
            :selected-items="selectedItemsNetwork"
            :total-items="reactiveNetworksWithVLANs.length"
            @toggle-select-all="toggleSelectNetwork"
          />
        </div>
      </div>
      <UiCardSpinner v-if="!isReady" />
      <div class="host-internal-networks-content">
        <UiTitle>
          {{ $t('host-internal-network') }}
          <template #actions>
            <UiButton :left-icon="faPlus" variant="secondary" accent="info" size="medium">{{ $t('new') }}</UiButton>
          </template>
        </UiTitle>
        <UiQuerySearchBar />
        <UiTableActions title="Table actions">
          <UiButton :left-icon="faEdit" variant="tertiary" accent="info" size="medium">{{ $t('edit') }}</UiButton>
          <UiButton :left-icon="faTrash" variant="tertiary" accent="danger" size="medium">{{ $t('delete') }}</UiButton>
        </UiTableActions>
        <div>
          <UiTopBottomTable
            :selected-items="selectedItemsHostInternalNW"
            :total-items="reactiveHostPrivateNetworks.length"
            @toggle-select-all="toggleSelectHostInternalNW"
          />
          <VtsTable>
            <thead>
              <tr>
                <th class="checkbox-header">
                  <UiCheckbox accent="info" @update:model-value="toggleSelectHostInternalNW($event)" />
                </th>
                <ColumnTitle id="name" :icon="faAlignLeft">{{ $t('name') }}</ColumnTitle>
                <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('description') }}</ColumnTitle>
                <ColumnTitle id="mtu" :icon="faHashtag">{{ $t('mtu') }}</ColumnTitle>
                <ColumnTitle id="locking" :icon="faCaretDown">{{ $t('locking-mode-default') }}</ColumnTitle>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in reactiveHostPrivateNetworks" :key="index">
                <td>
                  <UiCheckbox v-model="item.selected" accent="info" />
                </td>
                <td>{{ item.name_label }}</td>
                <td>{{ item.name_description }}</td>
                <td>{{ item.MTU }}</td>
                <td>{{ item.default_locking_mode }}</td>
              </tr>
            </tbody>
          </VtsTable>
          <UiTopBottomTable
            :selected-items="selectedItemsHostInternalNW"
            :total-items="reactiveHostPrivateNetworks.length"
            @toggle-select-all="toggleSelectHostInternalNW"
          />
        </div>
      </div>
      <UiCardSpinner v-if="!isReady" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import UiCard from '@/components/ui/UiCard.vue'
import UiCardSpinner from '@/components/ui/UiCardSpinner.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import {
  faAlignLeft,
  faCaretDown,
  faEdit,
  faHashtag,
  faPlus,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { networksWithVLANs, hostPrivateNetworks, isReady } = useNetworkStore().subscribe()

const reactiveNetworksWithVLANs = ref(networksWithVLANs.value || [])
const reactiveHostPrivateNetworks = ref(hostPrivateNetworks.value || [])

const selectedItemsNetwork = computed(() => reactiveNetworksWithVLANs.value.filter(item => item.selected).length)
const selectedItemsHostInternalNW = computed(
  () => reactiveHostPrivateNetworks.value.filter(item => item.selected).length
)

const toggleSelectNetwork = (isSelected: any) => {
  reactiveNetworksWithVLANs.value.forEach(item => {
    item.selected = isSelected
  })
}

const toggleSelectHostInternalNW = (isSelected: any) => {
  reactiveHostPrivateNetworks.value.forEach(item => {
    item.selected = isSelected
  })
}

watchEffect(() => {
  if (networksWithVLANs.value) {
    reactiveNetworksWithVLANs.value = networksWithVLANs.value || []
  }
  if (hostPrivateNetworks.value) {
    reactiveHostPrivateNetworks.value = hostPrivateNetworks.value || []
  }
})
</script>

<style lang="postcss" scoped>
.pool-network-view {
  display: flex;
  .card {
    display: flex;
    flex-direction: column;
    gap: 4rem;
    margin: 0.8rem;

    .networks-content,
    .host-internal-networks-content {
      display: flex;
      flex-direction: column;
      gap: 2.4rem;
    }
    .ui-info {
      align-items: center;
    }
    .checkbox-header {
      width: 4.8rem;
    }
  }
}
</style>
