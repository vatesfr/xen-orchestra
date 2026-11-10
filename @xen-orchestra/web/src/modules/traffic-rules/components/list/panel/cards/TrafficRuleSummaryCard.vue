<template>
  <UiPanelCard class="traffic-rule-summary-card">
    <UiPanelCardTitle size="medium" :label="t('traffic-rule')" icon="fa:traffic-rule" />
    <VtsCardRowList>
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
            <span class="status">
              <VtsStatus :status="policy" icon-only />
            </span>
            <div class="sentence">
              <span>
                {{ protocolLabel }}
                {{ direction.labelA }} {{ rule.ipRange }} {{ direction.labelB }}
              </span>
              <template v-if="vif">
                <UiLink
                  size="small"
                  icon="object:vif"
                  :to="{ name: '/vif/[id]/general', params: { id: vif.id } }"
                  :disabled="!vm"
                >
                  {{ vifDevice }}
                </UiLink>
                <template v-if="vm">
                  <span>{{ t('in') }}</span>
                  <UiLink
                    size="small"
                    :icon="vmPowerState"
                    :icon-tooltip="vmIconTooltip"
                    :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
                  >
                    {{ vm.name_label }}
                  </UiLink>
                </template>
              </template>
              <UiLink v-else-if="network" size="small" icon="object:network" :to="networkTo">
                {{ network.name_label }}
              </UiLink>
            </div>
          </div>
        </template>
        <template #addons>
          <VtsCopyButton :value="description" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useDirectionLabels } from '@/modules/traffic-rules/composables/direction-labels.composable.ts'
import { useTrafficRuleTarget } from '@/modules/traffic-rules/composables/traffic-rule-target.composable.ts'
import { getTrafficRuleProtocolLabel } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import { RULE_STATUS } from '@/shared/constants.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import type { TrafficRule } from '@vates/types'
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

const { getVmIconTooltip } = useXoVmOperationLabel()

const vmPowerState = computed(() => getVmIcon(vm.value))
const vmIconTooltip = computed(() => getVmIconTooltip(vm.value))

const ruleTypeLabel = computed(() => (rule.type === 'VIF' ? t('vif') : t('network')))

const direction = computed(() => {
  const [labelA, labelB] = getDirectionLabels(rule)

  return { labelA, labelB }
})

const protocolLabel = computed(() => getTrafficRuleProtocolLabel(rule))

const description = computed(() => {
  const policyLabel = rule.allow ? t('allow') : t('drop')
  const { label, suffix } = target.value
  const descriptionParts = [
    policyLabel,
    protocolLabel.value,
    direction.value.labelA,
    rule.ipRange,
    direction.value.labelB,
  ]

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
.traffic-rule-summary-card {
  .value-content {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
  }

  .status {
    display: flex;
    align-items: center;
    height: 1lh;
  }

  .sentence {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.4rem 0.8rem;
  }
}
</style>
