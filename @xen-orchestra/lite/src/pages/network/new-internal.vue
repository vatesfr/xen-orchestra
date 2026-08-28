<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-network:add-internal') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-network')" />

    <VtsOperationErrorCard
      v-else-if="hasNetworkCreationError && error"
      :title="t('unable-to-create-new-internal-network')"
      :error
      :error-message="t('new-network:error-message')"
    >
      <template #actions>
        <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
          {{ t('action:go-back') }}
        </UiButton>
      </template>
    </VtsOperationErrorCard>

    <UiCard v-show="canDisplayForm">
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <NewInternalNetworkForm :cancel-to="cancelRoute" @create="createNetwork" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import NewInternalNetworkForm from '@/modules/network/components/form/new/NewInternalNetworkForm.vue'
import {
  type NewInternalNetworkPayload,
  useInternalNetworkCreateJob,
} from '@/modules/network/jobs/internal-network-create.job.ts'
import { getPoolNetworkRoute } from '@/modules/network/utils/network.util.ts'
import { usePoolStore } from '@/stores/xen-api/pool.store.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const { pool } = usePoolStore().subscribe()

const error = ref<Error | undefined>()
const hasNetworkCreationError = computed(() => error.value !== undefined)

const formPayload = ref<NewInternalNetworkPayload>()

const { canRun, run: create, isRunning } = useInternalNetworkCreateJob(formPayload)

const canDisplayForm = computed(() => !isRunning.value && !hasNetworkCreationError.value)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (pool.value === undefined) {
    return { name: '/' }
  }

  return getPoolNetworkRoute(pool.value.uuid)
})

async function createNetwork(newPayload: NewInternalNetworkPayload) {
  formPayload.value = newPayload

  if (!canRun.value) {
    return
  }

  try {
    const networkId = await create()

    redirectAfterSuccess(networkId)
  } catch (rawError) {
    error.value = rawError as Error
  }
}

function handleGoBack() {
  error.value = undefined
}

function redirectAfterSuccess(networkId: XenApiNetwork['uuid']) {
  if (pool.value === undefined) {
    return router.push({ name: '/' })
  }

  return router.push(getPoolNetworkRoute(pool.value.uuid, networkId))
}
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
