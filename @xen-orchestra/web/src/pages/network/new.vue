<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-network:add') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-network')">
      <template #message>
        <I18nT keypath="new-network:creation-in-progress-message" scope="global">
          <template #tasksPageLink>
            <UiLink :to="{ name: '/pool/[id]/tasks', params: { id: poolId } }" size="small">
              {{ t('tasks-page') }}
            </UiLink>
          </template>
        </I18nT>
      </template>
    </VtsOperationPendingCard>

    <NetworkCreationErrorCard
      v-else-if="hasNetworkCreationError && error"
      :title="t('unable-to-create-new-network')"
      :error
      :error-message="t('new-network:error-message')"
      @go-back="handleGoBack()"
    />

    <UiCard v-show="canDisplayForm">
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <NewNetworkForm :cancel-to="cancelRoute" :pool-id="poolId as FrontXoPool['id']" @create="createNetwork" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import NewNetworkForm from '@/modules/network/components/form/new/NewNetworkForm.vue'
import NetworkCreationErrorCard from '@/modules/network/components/new/NetworkCreationErrorCard.vue'
import { type NewNetworkPayload, useXoNetworkCreateJob } from '@/modules/network/jobs/xo-network-create.job.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/xo-network.util.ts'
import { type FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection'
import type { ApiError } from '@/shared/error/api.error'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoNetwork } from '@vates/types'
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

const formPayload = ref<NewNetworkPayload>()

const error = ref<ApiError | Error | undefined>()
const hasNetworkCreationError = computed(() => error.value !== undefined)

const { canRun, run: create, isRunning } = useXoNetworkCreateJob(formPayload)

const canDisplayForm = computed(() => !isRunning.value && !hasNetworkCreationError.value)

async function createNetwork(newPayload: NewNetworkPayload) {
  formPayload.value = newPayload

  if (!canRun.value) {
    return
  }

  try {
    const [promiseCreateResult] = await create()

    if (promiseCreateResult.status === 'rejected') {
      throw promiseCreateResult.reason
    }

    redirectAfterSuccess(promiseCreateResult.value)
  } catch (_error) {
    error.value = _error as ApiError | Error
  }
}

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!poolId.value) {
    return { name: '/(site)/dashboard' }
  }

  return { name: '/pool/[id]/networks', params: { id: poolId.value } }
})

function handleGoBack() {
  error.value = undefined
}

function redirectAfterSuccess(networkId: XoNetwork['id']) {
  router.push(getPoolNetworkRoute(formPayload.value!.poolId, networkId))
}
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
