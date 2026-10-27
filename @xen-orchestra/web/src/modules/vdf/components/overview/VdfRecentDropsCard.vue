<template>
  <UiCard class="vdf-recent-drops-card">
    <UiTitle>
      {{ t('firewall:recent-drops') }}
      <template #action>
        <UiLink :to="{ name: '/pool/[id]/firewall/logs', params: { id: poolId } }" size="medium">
          {{ t('firewall:recent-drops:open-log') }}
        </UiLink>
      </template>
    </UiTitle>
    <p class="description typo-body-regular-small">
      {{ t('firewall:recent-drops:info', { n: VDF_RECENT_DROPS_WINDOW_MINUTES }) }}
    </p>
    <VtsStateHero v-if="!isRuleLogReady && hasRuleLogError" format="card" type="error" size="extra-small" horizontal>
      {{ t('firewall:recent-drops:error') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="!isRuleLogReady" format="card" type="busy" size="extra-small" />
    <VtsStateHero v-else-if="rows.length === 0" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('firewall:recent-drops:none', { n: VDF_RECENT_DROPS_WINDOW_MINUTES }) }}
    </VtsStateHero>
    <VdfDroppedTable
      v-else
      :scope-id="poolId"
      :rows
      :rate-label="t('firewall:recent-drops:count', { minutes: VDF_RECENT_DROPS_WINDOW_MINUTES })"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import VdfDroppedTable, { type VdfDroppedRow } from '@/modules/vdf/components/live/VdfDroppedTable.vue'
import { useVdfDecision } from '@/modules/vdf/composables/vdf-decision.composable.ts'
import { useVdfIpNames } from '@/modules/vdf/composables/vdf-ip-names.composable.ts'
import {
  useVdfRecentDrops,
  VDF_RECENT_DROPS_WINDOW_MINUTES,
} from '@/modules/vdf/composables/vdf-recent-drops.composable.ts'
import type { VdfDocument } from '@/modules/vdf/types.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// "What is being dropped right now?": the top flows of the rule log, each
// with a trace of the same packet
const {
  poolId,
  document,
  limit = 5,
} = defineProps<{
  poolId: string
  // the published document, which decided these drops
  document: VdfDocument
  limit?: number
}>()

const { t, n } = useI18n()

const { drops, isRuleLogReady, hasRuleLogError } = useVdfRecentDrops(() => poolId, { limit })

const { decision } = useVdfDecision(
  () => poolId,
  () => document
)

const { groupsOfIp, vmByIp } = useVdfIpNames(() => document)

// a source as the Monitor report and the rule log show it: its VM, of any
// pool (the trace only knows this pool's), else the groups listing it
function sourceEnd(ip: string, vm: FrontXoVm | undefined) {
  const shown = vm ?? vmByIp.value.get(ip)

  return { ip, vm: shown, groups: shown === undefined ? groupsOfIp(ip) : [] }
}

const rows = computed<VdfDroppedRow[]>(() =>
  drops.value.map(drop => {
    const from = drop.source?.name_label ?? drop.src
    // egress (vdf#53): the named VM is the source, the destination any address
    const to = drop.egress ? (drop.destination?.name_label ?? drop.dst) : drop.vm

    return {
      key: drop.key,
      src: drop.egress
        ? { ip: drop.src, vm: drop.source, name: drop.source === undefined ? drop.vm : undefined, groups: [] }
        : sourceEnd(drop.src, drop.source),
      dst: drop.egress ? sourceEnd(drop.dst, drop.destination) : { ip: '', vm: drop.destination, name: drop.vm },
      egress: drop.egress,
      revoked: false,
      proto: drop.proto,
      port: drop.port,
      decision: decision({ tier: drop.tier, policy: drop.policy, rule: drop.rule }),
      rate: t('firewall:recent-drops:count', { n: n(drop.count), minutes: VDF_RECENT_DROPS_WINDOW_MINUTES }),
      trace: drop.traceRoute,
      traceLabel: t('firewall:recent-drops:why', { from, to }),
    }
  })
)
</script>

<style lang="postcss" scoped>
.vdf-recent-drops-card {
  .description {
    margin-block-start: -1.6rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
