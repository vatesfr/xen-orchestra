<template>
  <UiPanel class="pif-panel">
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
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>
            {{ props.pif.id }}
          </template>
          <template #addons>
            <VtsIcon accent="warning" :icon="faCircle" :overlay-icon="faStar" />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network') }}
          </template>
          <template #value>
            {{ getNetworkData(pif, 'name_label') }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('device') }}
          </template>
          <template #value>
            {{ props.pif.device }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('pif-status') }}
          </template>
          <template #value>
            <PifStatus :icon="faCircle" :pif="props.pif" card />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('physical-interface-status') }}
          </template>
          <template #value>
            <PifStatus :icon="faCircle" :pif="props.pif" card />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('vlan') }}
          </template>
          <template #value>
            {{ props.pif.vlan }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('tags') }}
          </template>
          <template #value>
            <div class="tags">
              <UiTag v-for="tag in getTags(pif)" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>

      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-addresses') }}
          </template>
          <template #value>
            <p v-for="ip in allIps" :key="ip" v-tooltip class="ip-address text-ellipsis">{{ ip }}</p>
          </template>
          <template #addons>
            <UiButtonIcon v-if="allIps.length > 1" :icon="faEllipsis" size="medium" accent="info" />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mac-address') }}
          </template>
          <template #value>
            {{ props.pif.mac }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('netmask') }}
          </template>
          <template #value>
            {{ props.pif.netmask }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('dns') }}
          </template>
          <template #value>
            {{ props.pif.dns }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('gateway') }}
          </template>
          <template #value>
            {{ props.pif.gateway }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-mode') }}
          </template>
          <template #value>
            {{ props.pif.mode }}
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mtu') }}
          </template>
          <template #value>
            {{ props.pif.mtu }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('speed') }}
          </template>
          <template #value>
            {{ $t('mbs', { value: props.pif.speed }) }}
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network-block-device') }}
          </template>
          <template #value>
            {{ $t(`${getNetworkData(pif, 'nbd')}`) }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('default-locking-mode') }}
          </template>
          <template #value>
            {{ $t(`${getNetworkData(pif, 'defaultIsLocked')}`) }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCopy, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  pif: XoPif
}>()

const { get } = useNetworkStore().subscribe()

const allIps = computed(() => {
  return [props.pif.ip, ...props.pif.ipv6].filter(ip => ip)
})

const getNetworkData = (pif: XoPif, type: keyof XoNetwork) => {
  const network: XoNetwork = get(pif.$network)!
  if (type === 'name_label') {
    return network.name_label ? network.name_label : 'Unknown'
  } else if (type === 'nbd' || type === 'defaultIsLocked') {
    return network[type] ? 'on' : 'off'
  }
}
const getTags = (pif: XoPif) => {
  const network: XoNetwork = get(pif.$network)!
  return network.tags.length > 0 ? network.tags : []
}
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
