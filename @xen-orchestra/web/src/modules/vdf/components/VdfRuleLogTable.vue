<template>
  <div class="vdf-rule-log-table">
    <div class="filters">
      <UiRadioButtonGroup accent="brand" gap="wide">
        <UiRadioButton v-for="option of verdicts" :key="option" v-model="verdict" :value="option" accent="brand">
          {{ t(`firewall:log:verdict:${option}`) }}
        </UiRadioButton>
      </UiRadioButtonGroup>
      <UiInput
        v-model="search"
        accent="brand"
        :placeholder="t('firewall:log:search')"
        right-icon="fa:magnifying-glass"
      />
      <span class="live typo-body-regular-small"><span class="pulse" />{{ t('firewall:log:refreshing') }}</span>
    </div>
    <VtsTable :state>
      <thead>
        <tr>
          <VtsHeaderCell>{{ t('firewall:log:time') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:log:verdict') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:source') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:destination') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:service') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:log:decided-by') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('firewall:log:label') }}</VtsHeaderCell>
          <VtsHeaderCell />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="(entry, index) of visibleEntries" :key="`${entry.host}:${entry.time}:${index}`">
          <UiTableCell class="typo-body-regular-small nowrap">
            <span v-tooltip="entry.time">{{ formatTime(entry.time) }}</span>
          </UiTableCell>
          <UiTableCell>
            <VdfActionTag :action="entry.verdict === 'ALLOW' ? 'allow' : 'drop'" />
          </UiTableCell>
          <UiTableCell>
            <span class="end">
              <span class="typo-body-bold">{{ vmNameByIp.get(entry.src) ?? entry.src }}</span>
              <code v-if="vmNameByIp.has(entry.src)" class="secondary">{{ entry.src }}</code>
            </span>
          </UiTableCell>
          <UiTableCell>
            <span class="end">
              <span class="typo-body-bold">{{ entry.vm || entry.dst }}</span>
              <code v-if="entry.vm" class="secondary">{{ entry.dst }}</code>
            </span>
          </UiTableCell>
          <UiTableCell class="nowrap">
            <span class="end">
              <span class="proto typo-body-bold-small">{{ entry.proto.toUpperCase() }}</span>
              {{ entry.dport }}
            </span>
          </UiTableCell>
          <UiTableCell>
            <RouterLink
              :to="
                vdfPageRoute(poolId, 'policies', {
                  policy: entry.policy,
                  rule: entry.rule === 'default' ? undefined : Number(entry.rule),
                })
              "
              class="rule-link typo-body-regular-small"
            >
              {{ describeDecision(entry) }}
            </RouterLink>
            <div v-if="entry.suppressed" class="typo-body-regular-small secondary">
              {{ t('firewall:log:suppressed', { n: entry.suppressed }) }}
            </div>
          </UiTableCell>
          <UiTableCell class="typo-body-regular-small">{{ entry.label || t('none') }}</UiTableCell>
          <UiTableCell>
            <UiLink v-if="whyRoute(entry)" :to="whyRoute(entry)" size="small" icon="fa:route">
              {{ t('firewall:live:why') }}
            </UiLink>
          </UiTableCell>
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import VdfActionTag from '@/modules/vdf/components/VdfActionTag.vue'
import { useVdfRuleLog } from '@/modules/vdf/remote-resources/use-vdf-rule-log.ts'
import type { VdfRuleLogEntry } from '@/modules/vdf/types.ts'
import { displayName, globalRuleId, isGlobalName, vdfPageRoute } from '@/modules/vdf/utils/vdf-global.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiRadioButton from '@core/components/ui/radio-button/UiRadioButton.vue'
import UiRadioButtonGroup from '@core/components/ui/radio-button-group/UiRadioButtonGroup.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationRaw } from 'vue-router'

const { poolId, vmName } = defineProps<{
  poolId: string
  // only the entries of this VM's VIFs (as destination or source)
  vmName?: string
}>()

const { t, d } = useI18n()

const { ruleLog, isRuleLogReady } = useVdfRuleLog({}, () => poolId)

const { vms } = useXoVmCollection()

const vmNameByIp = computed(() => {
  const names = new Map<string, string>()

  for (const vm of vms.value) {
    for (const ip of Object.values(vm.addresses ?? {})) {
      names.set(ip, vm.name_label)
    }
  }

  return names
})

const verdicts = ['all', 'drop', 'allow'] as const

const verdict = ref<(typeof verdicts)[number]>('all')

const search = ref('')

const visibleEntries = computed(() => {
  const term = search.value.trim().toLowerCase()

  return [...(ruleLog.value?.entries ?? [])]
    .reverse()
    .filter(entry => verdict.value === 'all' || entry.verdict === verdict.value.toUpperCase())
    .filter(entry => vmName === undefined || entry.vm === vmName || vmNameByIp.value.get(entry.src) === vmName)
    .filter(
      entry =>
        term === '' ||
        [entry.vm, entry.src, entry.dst, entry.policy, entry.label, vmNameByIp.value.get(entry.src)]
          .filter(Boolean)
          .some(value => value!.toLowerCase().includes(term))
    )
    .slice(0, 300)
})

const state = computed<TableState | undefined>(() => {
  if (!isRuleLogReady.value) {
    return { type: 'busy' }
  }

  if ((ruleLog.value?.entries.length ?? 0) === 0) {
    return { type: 'no-data', message: t('firewall:log:empty') }
  }

  return visibleEntries.value.length === 0 ? { type: 'no-result' } : undefined
})

const vmIdByName = computed(() => new Map(vms.value.map(vm => [vm.name_label, vm.id])))

const vmIdByIp = computed(() => {
  const ids = new Map<string, string>()

  for (const vm of vms.value) {
    for (const ip of Object.values(vm.addresses ?? {})) {
      ids.set(ip, vm.id)
    }
  }

  return ids
})

// the same packet, traced: the log says what decided, the trace says why
function whyRoute(entry: VdfRuleLogEntry): RouteLocationRaw | undefined {
  const destination = entry.vm ? vmIdByName.value.get(entry.vm) : undefined
  const proto = entry.proto.split(' ')[0].toLowerCase()

  if (destination === undefined || !['tcp', 'udp', 'icmp'].includes(proto)) {
    return undefined
  }

  const source = vmIdByIp.value.get(entry.src)

  return {
    name: '/pool/[id]/firewall/trace',
    params: { id: poolId },
    query: {
      from: source ?? 'external',
      fromip: source === undefined ? entry.src : undefined,
      to: destination,
      proto,
      port: entry.dport || undefined,
      run: '1',
    },
  }
}

function describeDecision(entry: VdfRuleLogEntry) {
  const rule =
    entry.rule === 'default'
      ? t('firewall:log:default')
      : t('firewall:log:rule', { id: globalRuleId(Number(entry.rule)) })
  const policy = isGlobalName(entry.policy) ? `${displayName(entry.policy)} (${t('firewall:global')})` : entry.policy

  return `${entry.tier} · ${policy} · ${rule}`
}

function formatTime(time: string) {
  return d(new Date(time), { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
</script>

<style lang="postcss" scoped>
.vdf-rule-log-table {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2.4rem;
  }

  .end {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  .nowrap {
    white-space: nowrap;
  }

  .proto {
    padding: 0 0.6rem;
    border-radius: 0.4rem;
    background-color: var(--color-neutral-background-secondary);
  }

  .rule-link {
    color: var(--color-brand-txt-base);
  }

  .live {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    margin-inline-start: auto;
    color: var(--color-neutral-txt-secondary);
  }

  .pulse {
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 50%;
    background-color: var(--color-success-item-base);
    animation: pulse 2s ease-in-out infinite;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }

  code {
    font-family: monospace;
  }
}

@keyframes pulse {
  50% {
    opacity: 0.3;
  }
}
</style>
