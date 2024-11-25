<template>
  <UiPanel v-if="isReady" class="pif-panel">
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
        <p class="typo p3-regular">{{ props.pif.id }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('network') }}</p>
        <p class="typo p3-regular">{{ getNetworkInformation.name_label }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('device') }}</p>
        <p class="typo p3-regular">{{ props.pif.device }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('pif-status') }}</p>
        <PifStatus :icon="faCircle" :pif="props.pif" card />
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('physical-interface-status') }}</p>
        <PifStatus :icon="faCircle" :pif="props.pif" card />
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('vlan') }}</p>
        <p class="typo p3-regular">{{ props.pif.vlan }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('tags') }}</p>
        <div class="tags">
          <UiTag v-for="tag in getNetworkInformation.tags" :key="tag" accent="info" variant="secondary">
            {{ tag }}
          </UiTag>
        </div>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('ip-addresses') }}</p>
        <p v-for="ip in allIps" :key="ip" class="ip-address typo p3-regular">{{ ip }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('mac-addresses') }}</p>
        <p class="typo p3-regular">{{ props.pif.mac }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('netmask') }}</p>
        <p class="typo p3-regular">{{ props.pif.netmask }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('dns') }}</p>
        <p class="typo p3-regular">{{ props.pif.dns }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('gateway') }}</p>
        <p class="typo p3-regular">{{ props.pif.gateway }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('ip-mode') }}</p>
        <p class="typo p3-regular">{{ props.pif.mode }}</p>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('mtu') }}</p>
        <p class="typo p3-regular">{{ props.pif.mtu }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('speed') }}</p>
        <p class="typo p3-regular">{{ props.pif.speed }} {{ $t('mbs') }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('network-block-device') }}</p>
        <p class="typo p3-regular">{{ getNetworkInformation.nbd }}</p>
      </div>
      <div class="card-content">
        <p class="title typo p3-regular">{{ $t('default-locking-mode') }}</p>
        <p class="typo p3-regular">{{ getNetworkInformation.defaultIsLocked }}</p>
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
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { faCircle, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'

const props = defineProps<{
  pif: XoPif
}>()

const { isReady } = usePifStore().subscribe()
const { get } = useNetworkStore().subscribe()

const getNetworkInformation = computed(() => {
  const network: XoNetwork = get(props.pif.$network)!
  return network
})

const allIps = computed(() => {
  return [props.pif.ip, ...props.pif.ipv6].filter(ip => ip)
})
</script>

<style scoped lang="postcss">
.pif-panel {
  min-width: 400px;
  border-top: none;
}

.card {
  gap: 0.8rem;

  .card-content {
    width: 100%;
    display: flex;
    gap: 1.8rem;

    .title {
      min-width: 12rem;
      overflow-wrap: break-word;
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
}
</style>
