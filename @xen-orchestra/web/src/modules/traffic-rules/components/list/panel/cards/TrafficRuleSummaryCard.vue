<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <VtsIcon name="fa:traffic-rule" size="medium" />
      <UiLink size="medium" disabled>
        {{ t('traffic-rule') }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue align-top>
        <template #key>
          {{ t('description') }}
        </template>
        <template #value>
          <div class="value-content">
            <VtsStatus :status="policy" icon-only>{{ policy }}</VtsStatus>
            {{ rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol }}
            {{ direction.a }} {{ rule.ipRange }} {{ direction.b }}
            <template v-if="rule.type === 'VIF' && vif">
              <UiLink size="small" :to="{ name: '/vm/[id]/networks', params: { id: vif.$VM } }">
                {{ t('vif-device', { device: vif.device }) }}
              </UiLink>
              {{ t('traffic-rules:in') }}
              <UiLink
                v-if="vm"
                size="small"
                :icon="vmStatus"
                :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
              >
                {{ vm.name_label }}
              </UiLink>
            </template>
            <UiLink v-else-if="rule.type === 'network' && network" size="small" icon="object:network" :to="networkTo">
              {{ network.name_label }}
            </UiLink>
          </div>
        </template>
        <template #addons>
          <VtsCopyButton :value="description" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import type { TrafficRule } from '@/modules/traffic-rules/types.ts'
import { getDirectionLabels } from '@/modules/traffic-rules/utils/direction-labels-utils.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { CONNECTION_STATUS } from '@/shared/constants.ts'
import type { IconName } from '@core/icons'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{ rule: TrafficRule }>()

const { t } = useI18n()

const { getVifById } = useXoVifCollection()

const { getVmById } = useXoVmCollection()

const { getNetworkById } = useXoNetworkCollection()

const policy = computed(() => (rule.allow ? CONNECTION_STATUS.CONNECTED : CONNECTION_STATUS.DISCONNECTED))

const vif = computed(() => (rule.type === 'VIF' ? getVifById(rule.sourceId) : undefined))

const vm = computed(() => (vif.value ? getVmById(vif.value.$VM) : undefined))

const network = computed(() => (rule.type === 'network' ? getNetworkById(rule.sourceId) : undefined))

const networkTo = computed(() =>
  network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
)

const vmStatus = computed(() => {
  const state = vm.value?.power_state.toLowerCase()
  return `object:vm:${state}` as IconName
})

const direction = computed(() => {
  const [a, b] = getDirectionLabels(rule)
  return { a, b }
})

const description = computed(() => {
  const policyLabel = rule.allow ? t('traffic-rules:allow') : t('traffic-rules:drop')
  const protocol = rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol
  const descriptionParts = [policyLabel, protocol, direction.value.a, rule.ipRange, direction.value.b]

  if (rule.type === 'VIF' && vif.value) {
    descriptionParts.push(t('vif-device', { device: vif.value.device }))
    if (vm.value) {
      descriptionParts.push(t('traffic-rules:in'), vm.value.name_label)
    }
  } else if (rule.type === 'network' && network.value) {
    descriptionParts.push(network.value.name_label)
  }

  return descriptionParts.filter(Boolean).join(' ')
})
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .value-content {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
  }
}
</style>
