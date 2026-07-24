<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-network:add') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-network')" />

    <VtsOperationErrorCard
      v-else-if="hasNetworkCreationError && error"
      :title="t('unable-to-create-new-network')"
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
      <NewNetworkForm :cancel-to="cancelRoute" @create="createNetwork" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import NewNetworkForm from '@/modules/network/components/form/new/NewNetworkForm.vue'
import { type NewNetworkPayload, useNetworkCreateJob } from '@/modules/network/jobs/network-create.job.ts'
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
import { useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const { pool } = usePoolStore().subscribe()

const formPayload = ref<NewNetworkPayload>()

const error = ref<Error | undefined>()
const hasNetworkCreationError = computed(() => error.value !== undefined)

const { canRun, run: create, isRunning } = useNetworkCreateJob(formPayload)

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
    error.value = _error as Error
  }
}

const cancelRoute = computed(() => {
  if (pool.value === undefined) {
    return { name: '/' as const }
  }

  return getPoolNetworkRoute(pool.value.uuid)
})

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
