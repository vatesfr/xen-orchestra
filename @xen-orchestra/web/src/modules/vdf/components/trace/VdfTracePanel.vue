<template>
  <div class="vdf-trace-panel">
    <UiCard>
      <UiTitle>{{ t('firewall:trace:title') }}</UiTitle>
      <p class="description typo-body-regular-small">{{ t('firewall:trace:info') }}</p>
      <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />
      <VtsStateHero v-if="!areVmsReady || !areInterfacesReady" format="card" type="busy" size="small" />
      <VdfTraceForm
        v-else
        :vms="vmOptions"
        :initial
        :busy="isTracing"
        @trace="(request, query) => runTrace(request, query)"
      />
    </UiCard>

    <UiCard v-if="traceError || result">
      <UiAlert v-if="traceError" accent="danger">
        {{ t('firewall:trace:failed') }}
        <template #description>{{ traceError }}</template>
      </UiAlert>
      <VdfTraceResult v-else-if="result" :pool-id="pool.id" :result :document="publishedDocument" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfTraceForm, { type VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTraceResult from '@/modules/vdf/components/trace/VdfTraceResult.vue'
import { useVdfInterfaces } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfTraceJob } from '@/modules/vdf/jobs/vdf-trace.job.ts'
import type { VdfTraceRequest, VdfTraceResult as Result } from '@/modules/vdf/types.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { VM_POWER_STATE } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// A trace's form and result, on the Trace page and in the trace drawer.
// The form starts from `initial` (a link's query: run=1 runs it at once);
// each trace is emitted with its query (the page writes it in the URL).
// `active`: a trace running or shown.
const { pool, initial = {} } = defineProps<{
  pool: FrontXoPool
  initial?: VdfTraceQuery
}>()

const emit = defineEmits<{
  traced: [query: VdfTraceQuery]
}>()

const active = defineModel<boolean>('active', { default: false })

const { t } = useI18n()

// a trace runs against the flows the hosts have installed: the published
// document, whatever the draft says
const { publishedDocument, hasDraft } = useVdfPolicy(() => pool)

const { poolVms, areVmsReady } = useVdfMembers(() => pool.id, publishedDocument)

const { interfacesOf, areInterfacesReady } = useVdfInterfaces()

const vmOptions = computed(() =>
  [...poolVms.value]
    .sort((vmA, vmB) => vmA.name_label.localeCompare(vmB.name_label))
    .map(vm => ({
      id: vm.id,
      name: vm.name_label,
      running: vm.power_state === VM_POWER_STATE.RUNNING,
      // the interfaces with an address: a VM with several picks one (vdf#36)
      interfaces: interfacesOf(vm)
        .filter(iface => iface.ips.length > 0)
        .map(iface => ({
          ip: iface.ips[0],
          network: iface.vif.$network,
          label: t('firewall:trace:interface:option', {
            device: iface.vif.device,
            network: iface.network?.name_label ?? '?',
            ip: iface.ips[0],
          }),
        })),
    }))
)

const result = ref<Result>()

const traceError = ref<string>()

const request = ref<VdfTraceRequest>()

const { run, isRunning: isTracing } = useVdfTraceJob(() => pool.id, request)

async function runTrace(nextRequest: VdfTraceRequest, query: VdfTraceQuery) {
  emit('traced', JSON.parse(JSON.stringify(query)))

  request.value = nextRequest
  traceError.value = undefined
  active.value = true

  try {
    result.value = await run()
  } catch (error) {
    result.value = undefined
    traceError.value = (error as Error).message
  }
}
</script>

<style lang="postcss" scoped>
.vdf-trace-panel {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .description {
    margin-block-start: -1.6rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
