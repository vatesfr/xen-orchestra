<template>
  <UiHeadBar>
    {{ t('action:duplicate-n-vms', { n: 1 }) }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!areVmsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vm" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: vmId }) }}
    </VtsStateHero>

    <template v-else>
      <VtsOperationPendingCard v-if="isRunning" :title="t('duplicating-vm')" />

      <VtsOperationErrorCard
        v-else-if="error"
        :title="t('unable-to-duplicate-vm')"
        :error
        :error-message="t('duplicate-vm:error-message')"
      >
        <template #actions>
          <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
            {{ t('action:go-back') }}
          </UiButton>
        </template>
      </VtsOperationErrorCard>

      <UiCard v-show="canDisplayForm">
        <DuplicateVmForm :key="vm.id" :vm :cancel-to="cancelRoute" @duplicate="duplicateVm" />
      </UiCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import DuplicateVmForm from '@/modules/vm/components/form/duplicate/DuplicateVmForm.vue'
import { type DuplicateVmPayload, useXoVmDuplicateJob } from '@/modules/vm/jobs/xo-vm-duplicate.job.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { ApiError } from '@/shared/error/api.error.ts'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const vmId = computed(() => route.query.vmid as FrontXoVm['id'] | undefined)

const { areVmsReady, useGetVmById } = useXoVmCollection()

const vm = useGetVmById(vmId)

const formPayload = ref<DuplicateVmPayload>()
const error = ref<ApiError | Error | undefined>()

const { canRun, run: create, isRunning } = useXoVmDuplicateJob(vm, formPayload)

const canDisplayForm = computed(() => !isRunning.value && error.value === undefined)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vmId.value) {
    return { name: '/(site)/dashboard' }
  }

  return { name: '/vm/[id]/dashboard', params: { id: vmId.value } }
})

async function duplicateVm(payload: DuplicateVmPayload) {
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

<style scoped lang="postcss">
.card-container {
  padding: 0.8rem;
}
</style>
