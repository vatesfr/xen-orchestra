<template>
  <UiPanel class="host-pifs-side-panel">
    <VtsNoSelectionHero v-if="!pif" type="panel" />
    <template #header>
      <UiButton disabled size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
        {{ $t('edit') }}
      </UiButton>
      <UiButton disabled size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
    </template>
    <!-- PIF -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('pif') }}</UiCardTitle>
      <div class="content">
        <!-- UUID -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>
            {{ pif.id }}
          </template>
          <template #addons>
            <VtsIcon
              v-if="pif.management"
              v-tooltip="$t('management')"
              accent="warning"
              :icon="faCircle"
              :overlay-icon="faStar"
            />
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(pif.id)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- NETWORK -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network') }}
          </template>
          <template #value>
            <div class="network">
              <!-- TODO Remove the span when the link works and the icon is fixed -->
              <!--
              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
              <a href="">{{ networkNameLabel }}</a>
              -->
              <span v-tooltip class="text-ellipsis">{{ networkNameLabel }}</span>
            </div>
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(networkNameLabel)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- DEVICE -->
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
        <!-- PIF STATUS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('pif-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="pifStatus" />
          </template>
        </VtsCardRowKeyValue>
        <!-- PHYSICAL INTERFACE STATUS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('physical-interface-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="physicalInterfaceStatus" />
          </template>
        </VtsCardRowKeyValue>
        <!-- VLAN -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('vlan') }}
          </template>
          <template #value>
            {{ getVlan }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(getVlan!.toString())"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- TAGS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('tags') }}
          </template>
          <template #value>
            <div v-if="networkTags">{{ networkTags }}</div>
            <div v-else>
              <UiTagsList>
                <UiTag v-for="tag in networkTags" :key="tag" accent="info" variant="secondary">
                  {{ tag }}
                </UiTag>
              </UiTagsList>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <!-- NETWORK INFORMATION -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
      <div class="content">
        <!-- IP ADDRESSES -->
        <VtsCardRowKeyValue class="ip-addresses">
          <template #key>
            {{ $t('ip-addresses') }}
          </template>
          <template v-if="addressesIp.length > 0" #value>
            <div v-for="(ip, index) in addressesIp" :key="ip" class="ip-address-item">
              <span v-tooltip class="text-ellipsis">{{ ip }}</span>
              <div>
                <UiButtonIcon
                  v-if="ip !== '-'"
                  v-tooltip="copied && $t('core.copied')"
                  :icon="faCopy"
                  size="medium"
                  accent="info"
                  @click="copy(ip)"
                />
                <MenuList v-if="index === 0" placement="bottom-end">
                  <template #trigger="{ isOpen, open }">
                    <UiButtonIcon
                      v-if="index === 0 && addressesIp.length > 1"
                      v-tooltip="isOpen ? false : { content: $t('more-actions'), placement: 'bottom-end' }"
                      :icon="faEllipsis"
                      size="medium"
                      accent="info"
                      :selected="isOpen"
                      @click="open($event)"
                    />
                  </template>
                  <MenuItem :icon="faCopy" @click="copy(addressesIp.join(', '))">
                    <div>{{ t('copy-all') }}</div>
                  </MenuItem>
                </MenuList>
              </div>
            </div>
          </template>
        </VtsCardRowKeyValue>
        <!-- MAC ADDRESSES -->
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
        <!-- NETMASK -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('netmask') }}
          </template>
          <template #value>
            {{ getNetmask }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(getNetmask!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- DNS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('dns') }}
          </template>
          <template #value>
            {{ getDNS }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(getDNS!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- GATEWAY -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('gateway') }}
          </template>
          <template #value>
            {{ getGateway }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(getGateway!)"
            />
          </template>
        </VtsCardRowKeyValue>
        <!-- IP CONFIGURATION MODE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-mode') }}
          </template>
          <template #value>
            {{ getIpConfigurationMode }}
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <!-- PROPERTIES -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="content">
        <!-- MTU -->
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
        <!-- SPEED -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('speed') }}
          </template>
          <template #value>
            {{ byteFormatter(getSpeed) }}
          </template>
        </VtsCardRowKeyValue>
        <!-- NETWORK BLOCK DEVICE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network-block-device') }}
          </template>
          <template #value>
            {{ networkNbd }}
          </template>
          <template #addons>
            <UiButtonIcon
              v-tooltip="copied && $t('core.copied')"
              :icon="faCopy"
              size="medium"
              accent="info"
              @click="copy(networkNbd)"
            />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCopy, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { get } = useNetworkStore().subscribe()
const { records: pifs } = usePifStore().subscribe()

const { copy, copied } = useClipboard()
const { t } = useI18n()

const pifId = useRouteQuery('id')

const pif = computed(() => pifs.value.find(pif => pif.id === pifId.value))

const network = computed(() => (pif.value ? get(pif.value.$network) : undefined))

const addressesIp = computed(() => {
  if (!pif.value) return ['-']
  const ips = [pif.value.ip, ...pif.value.ipv6].filter(ip => ip)
  return ips.length > 0 ? ips : ['-']
})

const networkNameLabel = computed(() => network.value?.name_label || '-')

const networkNbd = computed(() => (network.value?.nbd ? t('on') : t('off')))

const networkTags = computed(() => (network.value?.tags?.length ? network.value.tags : '-'))

const pifStatus = computed(() => (pif.value?.attached ? 'connected' : 'disconnected'))

const physicalInterfaceStatus = computed(() => {
  return pif.value && pif.value.carrier ? 'connected' : 'physically-disconnected'
})

const getSpeed = computed(() => (pif.value ? pif.value.speed || 0 : 0))
const getVlan = computed(() => (pif.value?.vlan === -1 ? '-' : pif.value?.vlan))
const getNetmask = computed(() => (pif.value?.netmask === '' ? '-' : pif.value?.netmask))
const getDNS = computed(() => (pif.value?.dns === '' ? '-' : pif.value?.dns))
const getGateway = computed(() => (pif.value?.gateway === '' ? '-' : pif.value?.gateway))
const getIpConfigurationMode = computed(() => (pif.value?.mode === t('none') ? '-' : pif.value?.mode))

const byteFormatter = computed(() => (value: number) => {
  const speedInBytes = value * 1000000
  return humanFormat(speedInBytes, {
    scale: 'SI',
    unit: 'b/s',
    maxDecimals: 2,
  })
})
</script>

<style scoped lang="postcss">
.host-pifs-side-panel {
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

  .network {
    display: flex;
    gap: 0.8rem;
  }

  .ip-addresses {
    align-items: flex-start;
    .ip-address-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.4rem;
      justify-content: space-between;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
