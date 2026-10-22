<template>
  <div class="firewall-trace">
    <UiCard>
      <UiTitle>{{ t('firewall:trace:title') }}</UiTitle>
      <UiInfo accent="info" wrap>{{ t('firewall:trace:info') }}</UiInfo>
      <VtsStateHero v-if="!areVmsReady || vmOptions.length === 0" format="card" type="busy" size="small" />
      <VdfTraceForm v-else :vms="vmOptions" :initial="query" :busy="isTracing" @trace="runTrace" />
    </UiCard>

    <UiCard v-if="traceError || result">
      <UiAlert v-if="traceError" accent="danger">{{ traceError }}</UiAlert>
      <VdfTraceResult v-else-if="result" :pool-id="pool.id" :result />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfTraceForm from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTraceResult from '@/modules/vdf/components/trace/VdfTraceResult.vue'
import { useVdfMembers } from '@/modules/vdf/composables/vdf-members.composable.ts'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import type { VdfTraceRequest, VdfTraceResult as Result } from '@/modules/vdf/types.ts'
import { fetchPost } from '@/shared/utils/fetch.util.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const route = useRoute()

const query = route.query as Record<string, string | undefined>

const { document } = useVdfPolicy(() => pool)

const { runningVms, areVmsReady } = useVdfMembers(() => pool.id, document)

const vmOptions = computed(() =>
  [...runningVms.value]
    .sort((vmA, vmB) => vmA.name_label.localeCompare(vmB.name_label))
    .map(vm => ({ id: vm.id, label: vm.name_label }))
)

const isTracing = ref(false)

const result = ref<Result>()

const traceError = ref<string>()

async function runTrace(request: VdfTraceRequest) {
  isTracing.value = true
  traceError.value = undefined

  try {
    result.value = await fetchPost<Result>(`plugins/vdf/pools/${pool.id}/actions/trace`, request)
  } catch (error) {
    result.value = undefined
    traceError.value = ((error as Error).cause as { error?: string } | undefined)?.error ?? (error as Error).message
  } finally {
    isTracing.value = false
  }
}
</script>

<style lang="postcss" scoped>
.firewall-trace {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
