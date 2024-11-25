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
              <ColumnTitle id="more">
                <UiButtonIcon :icon="faEllipsis" size="medium" accent="info" />
              </ColumnTitle>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pif in pifs" :key="pif.id">
              <VtsCellText>
                <UiCheckbox accent="info" />
              </VtsCellText>
              <VtsCellText>
                <UiObjectLink>
                  <template #icon>
                    <UiComplexIcon size="medium">
                      <VtsIcon :icon="faNetworkWired" accent="current" />
                      <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                    </UiComplexIcon>
                  </template>
                  {{ getNetworkName(pif) }}
                </UiObjectLink>
              </VtsCellText>
              <VtsCellText>{{ pif.device }}</VtsCellText>
              <VtsCellObject class="pif-status">
                <PifStatus :icon="faCircle" :pif="pif" />
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
      </div>
    </div>
    <PifPanel :pif="selectedPif" />
  </div>
</template>

<script setup lang="ts">
import PifPanel from '@/components/pif/PifPanel.vue'
import PifStatus from '@/components/pif/PifStatus.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import VtsCellObject from '@core/components/cell-object/VtsCellObject.vue'
import VtsCellText from '@core/components/cell-text/VtsCellText.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import ColumnTitle from '@core/components/table/ColumnTitle.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiObjectLink from '@core/components/ui/object-link/UiObjectLink.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTableActions from '@core/components/ui/table-actions/UiTableActions.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useTreeFilter } from '@core/composables/tree-filter.composable'
import {
  faAlignLeft,
  faArrowsRotate,
  faAt,
  faCaretDown,
  faCheck,
  faCircle,
  faEdit,
  faEllipsis,
  faNetworkWired,
  faPowerOff,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const { isReady, pifsByHost } = usePifStore().subscribe()
const { get } = useNetworkStore().subscribe()
const { filter } = useTreeFilter()
const route = useRoute<'/host/[id]/network'>()
const pifs = computed(() => pifsByHost.value.get(route.params.id) ?? [])
const selectedPif = computed(() => pifs.value[0] ?? null)

const getNetworkName = (pif: XoPif) => {
  const network: XoNetwork = get(pif.$network)!
  return network.name_label ? network.name_label : 'Unknown'
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
  }

  .pif-status {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
