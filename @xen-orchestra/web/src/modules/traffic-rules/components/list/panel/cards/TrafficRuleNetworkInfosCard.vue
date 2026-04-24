<template>
  <UiCard class="card-container">
    <UiCardTitle>{{ t('network') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('network') }}
        </template>
        <template #value>
          <UiLink size="small" :to="networkTo" icon="object:network">
            <span v-tooltip class="text-ellipsis">{{ network.name_label }}</span>
          </UiLink>
        </template>
        <template #addons>
          <VtsCopyButton :value="network.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('uuid') }}
        </template>
        <template #value>
          {{ rule.networkId }}
        </template>
        <template #addons>
          <VtsCopyButton :value="rule.networkId" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('description') }}
        </template>
        <template #value>
          {{ network.name_description }}
        </template>
        <template v-if="network.name_description" #addons>
          <VtsCopyButton :value="network.name_description" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('type') }}
        </template>
        <template #value>
          {{ rule.type }}
        </template>
        <template #addons>
          <VtsCopyButton :value="rule.type" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue v-if="networkVlan">
        <template #key>
          {{ t('vlan') }}
        </template>
        <template #value>
          {{ networkVlan }}
        </template>
        <template v-if="networkVlan" #addons>
          <VtsCopyButton :value="String(networkVlan)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('mtu') }}
        </template>
        <template #value>{{ network.MTU }}</template>
        <template #addons>
          <VtsCopyButton :value="String(network.MTU)" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('network-block-device') }}</template>
        <template #value>{{ networkNbd }}</template>
        <template v-if="networkNbd" #addons>
          <VtsCopyButton :value="networkNbd" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('locking-mode-default') }}</template>
        <template #value>{{ networkDefaultLockingMode }}</template>
        <template #addons>
          <VtsCopyButton :value="networkDefaultLockingMode" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { TrafficRule } from '@/modules/traffic-rules/types.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  rule: TrafficRule
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const networkTo = computed(() => ({
  name: '/pool/[id]/networks',
  params: { id: network.$pool },
  query: { id: network.id },
}))

const { getPifsByNetworkId } = useXoPifCollection()

const pifs = computed(() => getPifsByNetworkId(network.id))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return
  }

  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
})

const networkNbd = computed(() => (network.nbd ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() => (network.defaultIsLocked ? t('disabled') : t('unlocked')))
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
