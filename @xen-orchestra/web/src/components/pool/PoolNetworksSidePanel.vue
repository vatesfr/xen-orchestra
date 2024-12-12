<template>
  <UiPanel v-if="network" class="pool-network-side-panel">
    <template #header>
      <UiButton disabled variant="tertiary" size="medium" accent="info" :left-icon="faEdit">{{ $t('edit') }}</UiButton>
      <UiButton disabled variant="tertiary" size="medium" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
      <UiButtonIcon disabled accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <UiCard v-if="network" class="card-container">
      <UiCardTitle class="typo p1-medium">
        <p v-tooltip="{ placement: 'bottom-end' }" class="text-ellipsis">{{ network.name_label }}</p>
      </UiCardTitle>
      <div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('id') }}</div>
          <div v-tooltip class="value text-ellipsis">{{ network.id }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" @click="copyToClipboard(network.id)" />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('description') }}</div>
          <div class="value text-ellipsis">{{ network.name_description }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" @click="copyToClipboard(network.name_description)" />
        </div>
        <div v-if="pifs[0].vlan" class="typo p3-regular content">
          <div class="title">{{ $t('vlan') }}</div>
          <div class="value">{{ getNetworkVlan(pifs[0].vlan) }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('mtu') }}</div>
          <div class="value">{{ network.MTU }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" @click="copyToClipboard(network.MTU)" />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('network-block-device') }}</div>
          <div class="value">{{ getNbd(network) }}</div>
          <UiButtonIcon accent="info" size="medium" :icon="faCopy" @click="copyToClipboard(network.nbd.toString())" />
        </div>
        <div class="typo p3-regular content">
          <div class="title">{{ $t('locking-mode-default') }}</div>
          <div class="value">{{ getLockingMode(network) }}</div>
        </div>
      </div>
    </UiCard>
    <UiCard v-if="network && network.PIFs && network.PIFs.length > 0" class="card-container">
      <div class="typo p1-medium">
        {{ $t('pifs') }}
        <UiCounter :value="selectedPIFsLength" variant="primary" size="small" accent="neutral" />
      </div>
      <table class="simple-table">
        <thead>
          <tr>
            <th class="text-left typo p3-regular text-ellipsis host">
              {{ $t('host') }}
            </th>
            <th class="text-left typo p3-regular text-ellipsis">
              {{ $t('device') }}
            </th>
            <th class="text-left typo p3-regular text-ellipsis">
              {{ $t('pifs-status') }}
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="pif in pifs" :key="pif.id" @click="redirectToHostNetwork(pif)">
            <td class="typo p3-regular text-ellipsis host">
              <UiObjectIcon
                :state="getHost(pif.$host)!.power_state ? 'running' : 'disabled'"
                type="host"
                size="small"
              />
              <a v-tooltip class="host text-ellipsis">
                {{ getHost(pif.$host)!.name_label }}
              </a>
            </td>
            <td class="typo p3-regular device text-ellipsis">{{ pif.device }}</td>
            <td class="typo p3-regular status">
              <PifStatus card :pif />
            </td>
            <td>
              <UiButtonIcon size="small" accent="info" :icon="faAngleRight" />
            </td>
          </tr>
        </tbody>
      </table>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import PifStatus from '@/components/pif/PifStatus.vue'
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoNetwork } from '@/types/xo/network.type'
import type { XoPif } from '@/types/xo/pif.type'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faAngleRight, faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const props = defineProps<{
  network: XoNetwork
  pifs: XoPif[]
}>()
const router = useRouter()
const { t } = useI18n()

const { records } = useHostStore().subscribe()
const selectedPIFsLength = computed(() => props.pifs!.length.toString())
const copyToClipboard = (text: string | number) => {
  const stringText = String(text)
  navigator.clipboard.writeText(stringText)
}
const getHost = (id: XoPif['$host']) => {
  return records.value.find(host => host.id === id)
}

const getNetworkVlan = (vlan: XoPif['vlan']) => {
  return vlan !== -1 ? vlan.toString() : t('none')
}

const getLockingMode = (network: XoNetwork) => {
  return network.defaultIsLocked ? t('disabled') : t('unlocked')
}

const getNbd = (network: XoNetwork) => {
  return network.nbd ? t('on') : t('off')
}
const redirectToHostNetwork = (pif: XoPif) => {
  router.push(`/host/${pif.$host}/network`)
  // TODO: Select the right row in network table
}
</script>

<style scoped lang="postcss">
.pool-network-side-panel {
  width: 40rem;
  border-top: none;

  .card-container {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    cursor: default;

    .content {
      display: flex;
      align-items: center;
      gap: 0.8rem;

      .title {
        color: var(--color-neutral-txt-secondary);
        min-width: 14rem;
      }

      .value {
        color: var(--color-neutral-txt-primary);
        width: 25rem;
      }
    }

    .text-left {
      text-align: left;
    }

    .simple-table {
      border-spacing: 0;
      padding: 0.4rem;

      td {
        padding: 0 0.4rem;
      }

      td.host {
        width: 13rem;
        max-width: 13rem;
      }

      td.device {
        width: 6rem;
        max-width: 6rem;
      }

      td.status {
        width: 12rem;
        max-width: 12rem;
      }

      tbody tr {
        cursor: pointer;

        &:hover {
          background-color: var(--color-info-background-hover);
        }
      }

      tbody tr td {
        color: var(--color-neutral-txt-primary);
      }

      tbody tr td a {
        margin-left: 0.8rem;
        text-decoration: underline solid #6b63bf;
      }
    }
  }
}
</style>
