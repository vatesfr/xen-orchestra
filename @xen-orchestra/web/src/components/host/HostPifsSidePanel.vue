<template>
  <UiPanel class="pif-panel">
    <VtsNoSelectionHero v-if="!pif" type="panel" />
    <template #header>
      <UiButton disabled size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
        {{ $t('edit') }}
      </UiButton>
      <UiButton disabled size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
    </template>
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('pif') }}</UiCardTitle>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>
            {{ pif.id }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pif.id)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network') }}
          </template>
          <template #value>
            {{ networkData('name_label').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(networkData('name_label').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('device') }}
          </template>
          <template #value>
            {{ pif.device }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pif.device)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('pifs-status') }}
          </template>
          <template #value>
            <PifStatus :network="getNetwork(pif)" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('physical-interface-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="physicalInterfaceStatus" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('vlan') }}
          </template>
          <template #value>
            {{ pifData('vlan').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pifData('vlan').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('tags') }}
          </template>
          <template #value>
            <div v-if="!Array.isArray(networkData('tags').value)">{{ networkData('tags').value }}</div>
            <div v-else class="tags">
              <UiTag v-for="tag in networkData('tags').value" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>

      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-addresses') }}
          </template>
          <template #value>
            <p v-for="ip in allIps" :key="ip" v-tooltip class="ip-address text-ellipsis">{{ pifData('ip').value }}</p>
            <p v-if="!allIps.length">{{ pifData('ip').value }}</p>
          </template>
          <template #addons>
            <UiButtonIcon v-if="allIps.length > 1" :icon="faEllipsis" size="medium" accent="info" />
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pifData('ip').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mac-address') }}
          </template>
          <template #value>
            {{ pif.mac }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pif.mac)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('netmask') }}
          </template>
          <template #value>
            {{ pifData('netmask').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pifData('netmask').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('dns') }}
          </template>
          <template #value>
            {{ pifData('dns').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pifData('dns').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('gateway') }}
          </template>
          <template #value>
            {{ pifData('gateway').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pifData('gateway').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-mode') }}
          </template>
          <template #value>
            {{ pifData('mode').value }}
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mtu') }}
          </template>
          <template #value>
            {{ pif.mtu }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pif.mtu)"
            />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('speed') }}
          </template>
          <template #value>
            {{ $t('mbs', { value: pif.speed }) }}
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network-block-device') }}
          </template>
          <template #value>
            {{ networkData('nbd').value }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(networkData('nbd').value!)"
            />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { get } = useNetworkStore().subscribe()
const { currentHostPifs: pifs } = usePifStore().subscribe()

const { copy, copied } = useClipboard()
const { t } = useI18n()

const pifId = useRouteQuery('id')
const pif = computed(() => pifs.value.find(pif => pif.id === pifId.value))

const allIps = computed(() => {
  return [pif.value!.ip, ...pif.value!.ipv6].filter(ip => ip)
})

const networkData = (type: keyof XoNetwork) => {
  return computed(() => {
    const network: XoNetwork = get(pif.value!.$network)!
    if (network) {
      switch (type) {
        case 'name_label':
          return network.name_label.toString() || '-'
        case 'nbd':
          return network[type] ? t('on') : t('off')
        case 'tags':
          return network.tags.length ? network.tags.toString() : '-'
      }
    }
    return '-'
  })
}

const getNetwork = (pif: XoPif) => {
  return get(pif.$network)!
}

const pifData = (type: keyof XoPif) => {
  return computed(() => {
    const value = pif.value![type]
    if (value) {
      switch (type) {
        case 'vlan':
          return value === -1 ? '-' : value.toString()
        case 'netmask':
        case 'dns':
        case 'gateway':
        case 'ip':
          return value === '' ? '-' : pif.value!.netmask.toString()
        case 'mode':
          return value === 'None' ? '-' : value.toString()
      }
    }
    return '-'
  })
}

const physicalInterfaceStatus = computed(() => {
  return pif.value!.carrier ? 'connected' : 'disconnected-from-physical-device'
})
</script>

<style scoped lang="postcss">
.pif-panel {
  width: 40rem;
  border-top: none;
}

.card {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .tags {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }
}
</style>
