<template>
  <!-- renders nothing: its labels go to the table -->
  <template v-if="false" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import type { VdfTrafficRuleLabel } from '@/modules/vdf/types.ts'
import { hostEnforces } from '@/modules/vdf/utils/vdf-status.util.ts'
import {
  mostSevere,
  shadowedVifs,
  TRAFFIC_RULE_ACCENTS,
  trafficRuleStatus,
} from '@/modules/vdf/utils/vdf-traffic-rules.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE } from '@vates/types'
import type { TrafficRule } from '@vates/types'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// What VDF does with each of XO's Traffic Rules of a pool (vdf#40, vdf#102),
// for XO 6's Traffic rules pages: mounted only where the pool runs VDF, it
// gives, by rule id, the label of the rules on VMs VDF guards (a rule of a
// network: the most telling of its guarded VMs')
const { pool, rules } = defineProps<{
  pool: FrontXoPool
  rules: TrafficRule[]
}>()

const statuses = defineModel<Record<string, VdfTrafficRuleLabel>>({ default: () => ({}) })

const { t } = useI18n()

const { publishedDocument, hosts, hostOf } = useVdfPolicy(() => pool)

const { protectedVms, quarantinedVms } = useVdfMembers(() => pool.id, publishedDocument)

const { vifs } = useXoVifCollection()

const { getVmById } = useXoVmCollection()

const guarded = computed(() => new Set([...protectedVms.value, ...quarantinedVms.value].map(vm => vm.id)))

const shadowed = computed(() => shadowedVifs(hosts.value))

const runsVdf = computed(() => hosts.value.some(({ state }) => hostEnforces(state)))

function statusOf(rule: TrafficRule) {
  const ruleVifs = vifs.value.filter(vif =>
    rule.type === 'VIF' ? vif.id === rule.sourceId : vif.$network === rule.sourceId && vif.$pool === pool.id
  )

  return mostSevere(
    ruleVifs
      .filter(vif => guarded.value.has(vif.$VM))
      .map(vif => {
        const vm = getVmById(vif.$VM)
        const host = vm?.power_state === VM_POWER_STATE.RUNNING ? hostOf(vm) : undefined

        return trafficRuleStatus(rule, shadowed.value.get(vif.id), host?.status?.aboveTrafficRules === true)
      })
  )
}

watch(
  () =>
    runsVdf.value
      ? Object.fromEntries(
          rules.flatMap(rule => {
            const status = statusOf(rule)

            return status === undefined
              ? []
              : [
                  [
                    rule.id,
                    {
                      label: t(`firewall:traffic-rule:status:${status}`),
                      tooltip: t(`firewall:traffic-rule:status:${status}:info`),
                      accent: TRAFFIC_RULE_ACCENTS[status],
                    },
                  ],
                ]
          })
        )
      : {},
  value => (statuses.value = value),
  { immediate: true, deep: true }
)
</script>
