<template>
  <UiHeadBar>
    {{ t('new-traffic-rule:add') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-traffic-rule')" />
    <VtsOperationErrorCard
      v-else-if="hasTrafficRuleCreationError && error"
      :title="t('unable-to-create-new-traffic-rule')"
      :error
      :error-message="t('new-traffic-rule:error-message')"
    >
      <template #actions>
        <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
          {{ t('action:go-back') }}
        </UiButton>
      </template>
    </VtsOperationErrorCard>
    <UiCard v-show="canDisplayForm">
      <UiTitle>{{ t('general-information') }}</UiTitle>
      <NewTrafficRuleForm :cancel-to="cancelRoute" :pool-id :vif-id @create="createTrafficRule" />
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
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

const { t } = useI18n()

// TODO: Waiting for the drawer (if it takes too long, check that the poolId is present)

const router = useRouter()
const route = useRoute()

const queryPoolId = ref(route.query.poolid as FrontXoPool['id'] | undefined)
const vifId = ref(route.query.vifid as FrontXoVif['id'] | undefined)

const { useGetVifById } = useXoVifCollection()

const vif = useGetVifById(() => vifId.value)

const poolId = computed<FrontXoPool['id'] | undefined>(() => queryPoolId.value ?? vif.value?.$pool)

const formPayload = ref<NewTrafficRulePayload>()

const error = ref<ApiError | Error | undefined>()
const hasTrafficRuleCreationError = computed(() => error.value !== undefined)

const { canRun, run: create, isRunning } = useXoTrafficRuleCreateJob(formPayload)

const canDisplayForm = computed(() => !isRunning.value && !hasTrafficRuleCreationError.value)

function handleGoBack() {
  error.value = undefined
}

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

    redirectAfterSuccess(newPayload)
  } catch (_error) {
    error.value = _error as ApiError | Error
  }
}

function redirectAfterSuccess(payload: NewTrafficRulePayload) {
  if (payload.targetType === 'VIF') {
    router.push({ name: '/vif/[id]/traffic-rules', params: { id: payload.targetId } })
    return
  }

  if (poolId.value) {
    router.push({ name: '/pool/[id]/security', params: { id: poolId.value } })
    return
  }

  router.push({ name: '/(site)/dashboard' })
}

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (vifId.value) {
    return { name: '/vif/[id]/traffic-rules', params: { id: vifId.value } }
  }

  if (queryPoolId.value) {
    return { name: '/pool/[id]/security', params: { id: queryPoolId.value } }
  }

  return { name: '/(site)/dashboard' }
})
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
