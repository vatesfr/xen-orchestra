<template>
  <div class="firewall-trace">
    <UiCard>
      <UiTitle>{{ t('firewall:trace:title') }}</UiTitle>
      <p class="description typo-body-regular-small">{{ t('firewall:trace:info') }}</p>
      <VdfDraftHint v-if="hasDraft" :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" />
      <VtsStateHero v-if="!areVmsReady" format="card" type="busy" size="small" />
      <VdfTraceForm
        v-else
        :key="formKey"
        :vms="vmOptions"
        :initial="initialQuery"
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

    <VdfRecentDropsCard v-else-if="!isTracing" :pool-id="pool.id" :document="publishedDocument" />
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftHint from '@/modules/vdf/components/overview/VdfDraftHint.vue'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import VdfTraceForm, { type VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTraceResult from '@/modules/vdf/components/trace/VdfTraceResult.vue'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { useVdfTraceJob } from '@/modules/vdf/jobs/vdf-trace.job.ts'
import type { VdfTraceRequest, VdfTraceResult as Result } from '@/modules/vdf/types.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { VM_POWER_STATE } from '@vates/types'
import { isEqual } from 'lodash-es'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const route = useRoute()

const router = useRouter()

// a trace runs against the flows the hosts have installed: the published
// document, whatever the draft says
const { publishedDocument, hasDraft } = useVdfPolicy(() => pool)

const { poolVms, areVmsReady } = useVdfMembers(() => pool.id, publishedDocument)

const vmOptions = computed(() =>
  [...poolVms.value]
    .sort((vmA, vmB) => vmA.name_label.localeCompare(vmB.name_label))
    .map(vm => ({ id: vm.id, name: vm.name_label, running: vm.power_state === VM_POWER_STATE.RUNNING }))
)

const result = ref<Result>()

const traceError = ref<string>()

// QUERY: the form starts from the route query, and writes it back on each
// trace. A link that changes the query from outside the form (a quick pick)
// starts a new form.

const readQuery = () => ({ ...route.query }) as VdfTraceQuery

const initialQuery = ref(readQuery())

const formKey = ref(0)

let ownQuery: VdfTraceQuery | undefined

watch(
  () => route.query,
  () => {
    const query = readQuery()

    if (!isEqual(query, ownQuery)) {
      initialQuery.value = query
      formKey.value++
      result.value = undefined
      traceError.value = undefined
    }
  }
)

// TRACE

const request = ref<VdfTraceRequest>()

const { run, isRunning: isTracing } = useVdfTraceJob(() => pool.id, request)

async function runTrace(nextRequest: VdfTraceRequest, query: VdfTraceQuery) {
  ownQuery = JSON.parse(JSON.stringify(query))
  void router.replace({ query: ownQuery })

  request.value = nextRequest
  traceError.value = undefined

  try {
    result.value = await run()
  } catch (error) {
    result.value = undefined
    traceError.value = (error as Error).message
  }
}
</script>

<style lang="postcss" scoped>
.firewall-trace {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .description {
    margin-block-start: -1.6rem;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
