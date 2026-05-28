<template>
  <UiCard class="card-container">
    <UiCardTitle>
      <VtsIcon name="fa:traffic-rule" size="medium" />
      <UiLink size="medium" disabled>
        {{ t('traffic-rule') }}
      </UiLink>
    </UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>
          {{ t('rule-type') }}
        </template>
        <template #value>
          {{ ruleTypeLabel }}
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>
          {{ t('description') }}
        </template>
        <template #value>
          <div class="value-content">
            <VtsStatus :status="policy" icon-only />
            {{ rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol }}
            {{ direction.labelA }} {{ rule.ipRange }} {{ direction.labelB }}
            <template v-if="vif">
              <UiLink
                size="small"
                icon="object:vif"
                :to="vif ? { name: '/vif/[id]/general', params: { id: vif.id } } : undefined"
                :disabled="!vm"
              >
                {{ vifDevice }}
              </UiLink>
              <div v-if="vm">
                {{ t('in') }}
                <UiLink size="small" :icon="vmPowerState" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }">
                  {{ vm.name_label }}
                </UiLink>
              </div>
            </template>
            <UiLink v-else-if="network" size="small" icon="object:network" :to="networkTo">
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
import { useDirectionLabels } from '@/modules/traffic-rules/composables/direction-labels.composable.ts'
import { useTrafficRuleTarget } from '@/modules/traffic-rules/composables/traffic-rule-target.composable.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { RULE_STATUS } from '@/shared/constants.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { objectIcon } from '@core/icons'
import type { TrafficRule } from '@vates/types'
import { toLower } from 'lodash-es'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { rule } = defineProps<{ rule: TrafficRule }>()

const { t } = useI18n()

const { getVifById } = useXoVifCollection()

const { getVmById } = useXoVmCollection()

const { getNetworkById } = useXoNetworkCollection()

const getTarget = useTrafficRuleTarget()

const getDirectionLabels = useDirectionLabels()

const policy = computed(() => (rule.allow ? RULE_STATUS.ALLOW : RULE_STATUS.DROP))

const target = computed(() => getTarget(rule))

const vif = computed(() => (rule.type === 'VIF' ? getVifById(rule.sourceId) : undefined))

const vm = computed(() => (vif.value ? getVmById(vif.value.$VM) : undefined))

const network = computed(() => (rule.type === 'network' ? getNetworkById(rule.sourceId) : undefined))

const networkTo = computed(() =>
  network.value ? getPoolNetworkRoute(network.value.$pool, network.value.id) : undefined
)

const vmPowerState = computed(() => objectIcon('vm', toLower(vm.value?.power_state)))

const ruleTypeLabel = computed(() => (rule.type === 'VIF' ? t('vif') : t('network')))

const direction = computed(() => {
  const [labelA, labelB] = getDirectionLabels(rule)

  return { labelA, labelB }
})

const description = computed(() => {
  const policyLabel = rule.allow ? t('allow') : t('drop')
  const protocol = rule.port ? `${rule.protocol}:${rule.port}` : rule.protocol
  const { label, suffix } = target.value
  const descriptionParts = [policyLabel, protocol, direction.value.labelA, rule.ipRange, direction.value.labelB]

  if (label) {
    descriptionParts.push(label)
    if (suffix) {
      descriptionParts.push(t('in'), suffix.label)
    }
  }

  return descriptionParts.join(' ')
})

const vifDevice = computed(() => `${t('vif')}${vif.value?.device}`)
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
