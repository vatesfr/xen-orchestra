<template>
  <UiDrawer
    :on-dismiss="() => emit('cancel')"
    class="traffic-rule-edit-order-drawer"
    @confirm="emit('confirm', orderedRules)"
    @dismiss="emit('cancel')"
  >
    <template #title>{{ t('action:edit-rules-order') }}</template>

    <template #content>
      <div class="container">
        <div class="network typo-body-regular-small">
          <span class="label">{{ t('network') }}</span>
          <UiLink v-if="network" :to="networkTo" icon="object:network" size="small">
            {{ network.name_label }}
          </UiLink>
        </div>

        <UiAlert accent="info">
          <p>{{ t('traffic-rules:edit-order-info') }}</p>
          <p>{{ t('traffic-rules:edit-order-save-info') }}</p>
        </UiAlert>

        <VtsTable :pagination-bindings sticky="right">
          <thead>
            <tr>
              <HeadCells />
            </tr>
          </thead>
          <tbody>
            <VtsRow v-for="rule of paginatedRules" :key="rule.id">
              <BodyCells :item="rule" />
            </VtsRow>
          </tbody>
        </VtsTable>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>
        {{ t('action:save') }}
      </VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { useDirectionLabels } from '@/modules/traffic-rules/composables/direction-labels.composable.ts'
import { useTrafficRuleTarget } from '@/modules/traffic-rules/composables/traffic-rule-target.composable.ts'
import { useTrafficRulesOrder } from '@/modules/traffic-rules/composables/traffic-rules-order.composable.ts'
import type { RankedTrafficRule } from '@/modules/traffic-rules/types.ts'
import { getTrafficRuleProtocolLabel } from '@/modules/traffic-rules/utils/xo-traffic-rule.util.ts'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useTrafficRulesColumns } from '@core/tables/column-sets/traffic-rules-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network, rules } = defineProps<{
  network: FrontXoNetwork | undefined
  rules: RankedTrafficRule[]
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [orderedRules: RankedTrafficRule[]]
}>()

const { t } = useI18n()

const getTarget = useTrafficRuleTarget()

const getDirectionLabels = useDirectionLabels()

const networkTo = computed(() => {
  if (network === undefined) {
    return undefined
  }

  return getPoolNetworkRoute(network.$pool, network.id)
})

const { orderedRules, paginatedRules, paginationBindings, getNewRank, isFirstRule, isLastRule, moveRule } =
  useTrafficRulesOrder(() => rules)

const { HeadCells, BodyCells } = useTrafficRulesColumns({
  exclude: ['network', 'priority', 'actions'],
  body: (rule: RankedTrafficRule) => {
    const [directionA, directionB] = getDirectionLabels(rule)

    return {
      rank: r => {
        const newRank = getNewRank(rule)

        return r(newRank, rule.rank - newRank)
      },
      policy: r => r(t(rule.allow ? 'allow' : 'drop'), rule.allow ? 'success' : 'danger'),
      protocol: r => r(getTrafficRuleProtocolLabel(rule)),
      directionA: r => r(directionA),
      target: r => r(rule.ipRange),
      directionB: r => r(directionB),
      object: r => r(getTarget(rule)),
      moveButtons: r =>
        r([
          {
            icon: 'action:move-up',
            label: t('action:move-up'),
            onClick: () => moveRule(rule, -1),
            disabled: isFirstRule(rule),
          },
          {
            icon: 'action:move-down',
            label: t('action:move-down'),
            onClick: () => moveRule(rule, 1),
            disabled: isLastRule(rule),
          },
        ]),
    }
  },
})
</script>

<style lang="postcss" scoped>
.traffic-rule-edit-order-drawer {
  .container {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .network {
    display: flex;
    align-items: center;
    gap: 2.4rem;

    .label {
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
