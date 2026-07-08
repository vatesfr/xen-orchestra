<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-vif:add') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!areVmsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vm" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: vmId }) }}
    </VtsStateHero>

    <template v-else>
      <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-vif')" />
      <VtsOperationErrorCard
        v-else-if="error"
        :title="t('unable-to-create-new-vif')"
        :error
        :error-message="t('new-vif:error-message')"
      >
        <template #actions>
          <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
            {{ t('action:go-back') }}
          </UiButton>
        </template>
      </VtsOperationErrorCard>
      <UiCard v-show="canDisplayForm">
        <UiTitle>{{ t('configuration') }}</UiTitle>
        <NewVifForm v-if="vm" :vm-id="vm.id" :pool-id="vm.$pool" :cancel-to="cancelRoute" @create="createVif" />
      </UiCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import NewVifForm from '@/modules/vif/components/form/new/NewVifForm.vue'
import { type NewVifPayload, useXoVifCreateJob } from '@/modules/vif/jobs/xo-vif-create.job.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()

const vmId = computed(() => route.query.vmId as FrontXoVm['id'] | undefined)

const { areVmsReady, useGetVmById } = useXoVmCollection()

const vm = useGetVmById(vmId)

const formPayload = ref<NewVifPayload>()

const error = ref<ApiError | Error | undefined>()

const { canRun, run: create, isRunning } = useXoVifCreateJob(formPayload)

const canDisplayForm = computed(() => !isRunning.value && error.value === undefined)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vmId.value) {
    return { name: '/(site)/dashboard' }
  }

  return { name: '/vm/[id]/networks', params: { id: vmId.value } }
})

async function createVif(payload: NewVifPayload) {
  formPayload.value = payload

  if (!canRun.value) {
    return
  }

  try {
    const [promiseResult] = await create()

    if (promiseResult.status === 'rejected') {
      throw promiseResult.reason
    }

    await router.push(cancelRoute.value)
  } catch (_error) {
    error.value = _error as ApiError | Error
  }
}

function handleGoBack() {
  error.value = undefined
}
</script>

<style lang="postcss" scoped>
.card-container {
  padding: 0.8rem;
}
</style>
