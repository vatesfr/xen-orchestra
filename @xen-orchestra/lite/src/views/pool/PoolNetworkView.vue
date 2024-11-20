<!-- v1 -->
<template>
  <div class="network-view-container">
    <UiCard class="card-wrapper">
      <div class="networks-container">
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
            :total-items="networksWithVLANs.length"
            @toggle-select-all="toggleSelectNetwork"
          />
          <VtsTable>
            <thead>
              <tr>
                <th><UiCheckbox accent="info" @change="toggleSelectNetwork" /></th>
                <ColumnTitle id="name" :icon="faAlignLeft">{{ $t('name') }}</ColumnTitle>
                <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('description') }}</ColumnTitle>
                <ColumnTitle id="pifs" :icon="faPowerOff">{{ $t('pifs-status') }}</ColumnTitle>
                <ColumnTitle id="vlan" :icon="faAlignLeft">{{ $t('vlan') }}</ColumnTitle>
                <ColumnTitle id="mtu" :icon="faHashtag">{{ $t('mtu') }}</ColumnTitle>
                <ColumnTitle id="locking" :icon="faCaretDown">{{ $t('locking-mode') }}</ColumnTitle>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in networksWithVLANs" :key="index">
                {{
                  item.selected
                }}
                <td><UiCheckbox v-model="item.selected" accent="info" /></td>
                <td>{{ item.name_label }}</td>
                <td>{{ item.name_description }}</td>
                <td>
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
            :total-items="networksWithVLANs.length"
            @toggle-select-all="toggleSelectNetwork"
          />
        </div>
      </div>
      <div class="host-internal-networks-container">
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
            :total-items="hostPrivateNetworks.length"
            @toggle-select-all="toggleSelectHostInternalNW"
          />
          <VtsTable>
            <thead>
              <tr>
                <th><UiCheckbox accent="info" @change="toggleSelectHostInternalNW" /></th>
                <ColumnTitle id="name" :icon="faAlignLeft">{{ $t('name') }}</ColumnTitle>
                <ColumnTitle id="description" :icon="faAlignLeft">{{ $t('description') }}</ColumnTitle>
                <ColumnTitle id="mtu" :icon="faHashtag">{{ $t('mtu') }}</ColumnTitle>
                <ColumnTitle id="locking" :icon="faCaretDown">{{ $t('locking-mode-default') }}</ColumnTitle>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in hostPrivateNetworks" :key="index">
                <td><UiCheckbox v-model="item.selected" accent="info" /></td>
                <td>{{ item.name_label }}</td>
                <td>{{ item.name_description }}</td>
                <td>{{ item.MTU }}</td>
                <td>{{ item.default_locking_mode }}</td>
              </tr>
            </tbody>
          </VtsTable>
          <UiTopBottomTable
            :selected-items="selectedItemsHostInternalNW"
            :total-items="hostPrivateNetworks.length"
            @toggle-select-all="toggleSelectHostInternalNW"
          />
        </div>
      </div>
    </UiCard>
    <UiPanel>
      <template #header>
        <UiButton variant="tertiary" size="medium" accent="info" :left-icon="faEdit">{{ $t('edit') }}</UiButton>
        <UiButton variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">{{ $t('delete') }}</UiButton>
        <UiButtonIcon accent="info" size="medium" :icon="faEllipsis" />
      </template>
      <!--
      <UiCard class="card-container">
        <div class="typo p1-medium">Network Name</div>
        <div>
          <div class="typo p3-regular content-details">
            <div>UUID</div>
            <div>71df26a2-678a-49c7-823..</div>
            <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
          </div>
          <div class="typo p3-regular content-details">
            <div>{{ $t('description') }}</div>
            <div>Lorem ipsum</div>
            <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
          </div>
          <div class="typo p3-regular content-details">
            <div>Vlan</div>
            <div>100</div>
            <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
          </div>
          <div class="typo p3-regular content-details">
            <div>MTU</div>
            <div>1500</div>
            <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
          </div>
          <div class="typo p3-regular content-details">
            <div>Network block device</div>
            <div>Lorem</div>
            <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
          </div>
          <div class="typo p3-regular content-details">
            <div>Defaut locking mode</div>
            <div>true</div>
          </div>
        </div>
      </UiCard>
      -->
    </UiPanel>
  </div>
</template>

<script lang="ts" setup>
import UiCard from '@/components/ui/UiCard.vue'
import { usePageTitleStore } from '@/stores/page-title.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import UiTopBottomTable from '@core/components/ui/top-bottom-table/UiTopBottomTable.vue'
import {
  faAlignLeft,
  faCaretDown,
  faEdit,
  faEllipsis,
  faHashtag,
  faPlus,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

usePageTitleStore().setTitle(useI18n().t('network'))

const { networksWithVLANs, hostPrivateNetworks } = useNetworkStore().subscribe()

const toggleSelectNetwork = (isSelected: boolean) => {
  networksWithVLANs.value.forEach(item => {
    item.selected = isSelected
  })
}

const toggleSelectHostInternalNW = (isSelected: boolean) => {
  hostPrivateNetworks.value.forEach(item => (item.selected = isSelected))
}

const selectedItemsNetwork = computed(() => networksWithVLANs.value.filter(item => item.selected).length)
const selectedItemsHostInternalNW = computed(() => hostPrivateNetworks.value.filter(item => item.selected).length)
</script>

<style lang="postcss" scoped>
.network-view-container {
  display: flex;
}
.card-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  margin: 0.8rem;

  .networks-container,
  .host-internal-networks-container {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }
}
.ui-info {
  align-items: center;
}
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content-details {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    div:first-child {
      color: var(--color-neutral-txt-secondary);
      width: 12rem;
    }
    div:nth-child(2) {
      color: var(--color-neutral-txt-primary);
      width: 20rem;
    }
  }
}
</style>
