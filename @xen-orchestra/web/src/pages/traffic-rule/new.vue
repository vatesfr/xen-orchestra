<template>
  <UiHeadBar>
    <span class="header">{{ t('new-traffic-rule:add') }}</span>
  </UiHeadBar>

  <div class="card-container">
    <UiCard v-show="canDisplayForm">
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <NewTrafficRuleForm :cancel-to="cancelRoute" :pool-id="poolId" @create="createTrafficRule" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import NewTrafficRuleForm from '@/modules/traffic-rules/components/form/new/NewTrafficRuleForm.vue'
import {
  type NewTrafficRulePayload,
  useXoTrafficRuleCreateJob,
} from '@/modules/traffic-rules/jobs/xo-traffic-rule-create.job.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const poolId = ref(route.query.poolid as FrontXoPool['id'] | undefined)

onMounted(() => {
  if (route.query.poolid) {
    router.replace({ query: { ...route.query, poolid: undefined } })
  }
})

const formPayload = ref<NewTrafficRulePayload>()

const error = ref<ApiError | Error | undefined>()
const hasTrafficRuleCreationError = computed(() => error.value !== undefined)

const { canRun, run: create, isRunning } = useXoTrafficRuleCreateJob(formPayload)

const canDisplayForm = computed(() => !isRunning.value && !hasTrafficRuleCreationError.value)

async function createTrafficRule(newPayload: NewTrafficRulePayload) {
  formPayload.value = newPayload

  if (!canRun.value) {
    return
  }

  try {
    const [promiseCreateResult] = await create()

    if (promiseCreateResult.status === 'rejected') {
      throw promiseCreateResult.reason
    }

    redirectAfterSuccess()
  } catch (_error) {
    error.value = _error as ApiError | Error
  }
}

function redirectAfterSuccess() {
  if (poolId.value) {
    router.push({ name: '/pool/[id]/security', params: { id: poolId.value } })
  }
}

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!poolId.value) {
    return { name: '/(site)/dashboard' }
  }
  return { name: '/pool/[id]/security', params: { id: poolId.value } }
})
</script>

<style lang="postcss" scoped>
.header {
  font-family: 'Poppins Vates', sans-serif;
}

.card-container {
  padding: 0.8rem;
}
</style>
