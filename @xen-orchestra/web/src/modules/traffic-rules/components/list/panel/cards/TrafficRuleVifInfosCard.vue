<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('vif') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('name') }}
        </template>
        <template #value>
          <UiLink
            size="small"
            icon="object:vif"
            :to="vm ? { name: '/vm/[id]/networks', params: { id: vm?.id } } : undefined"
          >
            {{ vifDevice }}
          </UiLink>
        </template>
        <template #addons>
          <VtsCopyButton :value="vif.device" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('uuid') }}
        </template>
        <template #value>
          <VtsCodeSnippet :content="vif.id" copy />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('vm') }}
        </template>
        <template v-if="vm" #value>
          <UiLink size="small" :icon="vmStatus" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
            {{ vm.name_label }}
          </UiLink>
        </template>
        <template v-if="vm" #addons>
          <VtsCopyButton :value="vm.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('network') }}
        </template>
        <template #value>
          <UiLink v-if="network" size="small" :to="networkTo" icon="object:network">
            {{ network.name_label }}
          </UiLink>
        </template>
        <template v-if="network" #addons>
          <VtsCopyButton :value="network.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('device') }}
        </template>
        <template #value>
          {{ vifDevice }}
        </template>
        <template #addons>
          <VtsCopyButton :value="vifDevice" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('vif-status') }}
        </template>
        <template #value>
          <VtsStatus :status="vifStatus" />
        </template>
        <template #addons>
          <VtsCopyButton :value="vifStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('vlan') }}
        </template>
        <template #value>{{ networkVlan }}</template>
        <template v-if="networkVlan" #addons>
          <VtsCopyButton :value="networkVlan" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('mtu') }}
        </template>
        <template #value>
          {{ vif.MTU }}
        </template>
        <template #addons>
          <VtsCopyButton :value="String(vif.MTU)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('locking-mode') }}
        </template>
        <template #value>
          {{ vif.lockingMode }}
        </template>
        <template #addons>
          <VtsCopyButton :value="vif.lockingMode" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('check-summing') }}
        </template>
        <template #value>
          {{ vif.txChecksumming }}
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { TrafficRule } from '@/modules/traffic-rules/types'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { ObjectIconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ rule: TrafficRule; vif: FrontXoVif }>()

const { t } = useI18n()

const { useGetNetworkById } = useXoNetworkCollection()

const { useGetVmById } = useXoVmCollection()

const { getPifsByNetworkId } = useXoPifCollection()

const vifStatus = computed(() => (vif.attached ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED))

const vm = useGetVmById(() => vif.$VM)

const vmStatus = computed(() => {
  const state = toLower(vm.value?.power_state)

  return `object:vm:${state === undefined ? 'unknown' : state}` as ObjectIconName
})

const network = useGetNetworkById(() => vif.$network)

const networkTo = computed(() =>
  network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
)

const pifs = computed(() => getPifsByNetworkId(vif.$network))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return
  }

  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
})

const vifDevice = computed(() => `${t('vif')}${vif.device}`)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
