<template>
  <UiHeadBar icon="fa:plus">
    {{ t('new-vdi:add') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!areVmsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vm" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: vmId }) }}
    </VtsStateHero>

    <template v-else>
      <VtsOperationPendingCard v-if="isRunning" :title="t('creating-new-vdi')" />

      <VdiCreationErrorCard
        v-else-if="hasCreationError && error"
        :title="t('unable-to-create-new-vdi')"
        :error
        :error-message="t('new-vdi:error-message')"
        @go-back="handleGoBack()"
      />

      <UiCard v-show="canDisplayForm">
        <UiTitle>{{ t('configuration') }}</UiTitle>
        <NewVdiForm :vm :cancel-to="cancelRoute" @create="createVdi" />
      </UiCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import NewVdiForm from '@/modules/vdi/components/form/new/NewVdiForm.vue'
import VdiCreationErrorCard from '@/modules/vdi/components/new/VdiCreationErrorCard.vue'
import { type NewVdiPayload, useXoVdiCreateJob } from '@/modules/vdi/jobs/xo-vdi-create.job.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const vmId = route.query.vmid as FrontXoVm['id'] | undefined

const { areVmsReady, useGetVmById } = useXoVmCollection()

const vm = useGetVmById(() => vmId)

const formPayload = ref<NewVdiPayload>()
const error = ref<ApiError | Error | undefined>()

const { canRun, run: create, isRunning } = useXoVdiCreateJob(formPayload)

const hasCreationError = computed(() => error.value !== undefined)
const canDisplayForm = computed(() => !isRunning.value && !hasCreationError.value)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vmId) {
    return { name: '/(site)/dashboard' }
  }
  return { name: '/vm/[id]/vdis', params: { id: vmId } }
})

async function createVdi(newPayload: NewVdiPayload) {
  formPayload.value = newPayload

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
