<template>
  <UiHeadBar icon="fa:link">
    {{ t('attach-vdi') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!areVmsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vm" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: vmId }) }}
    </VtsStateHero>

    <template v-else>
      <VtsOperationPendingCard v-if="isRunning" :title="t('attaching-vdi')" />

      <VtsOperationErrorCard
        v-else-if="hasAttachError && error"
        :title="t('unable-to-attach-vdi')"
        :error
        :error-message="t('attach-vdi:error-message')"
      >
        <template #actions>
          <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
            {{ t('action:go-back') }}
          </UiButton>
        </template>
      </VtsOperationErrorCard>

      <UiCard v-show="canDisplayForm">
        <VdiAttachForm :vm :cancel-to="cancelRoute" @attach="attachVdi" />
      </UiCard>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { type NewVbdPayload, useXoVbdCreateJob } from '@/modules/vbd/jobs/xo-vbd-create.job.ts'
import VdiAttachForm from '@/modules/vdi/components/form/attach/VdiAttachForm.vue'
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
const router = useRouter()
const route = useRoute()

const vmId = route.query.vmid as FrontXoVm['id'] | undefined

const { areVmsReady, useGetVmById } = useXoVmCollection()

const vm = useGetVmById(() => vmId)

const formPayload = ref<NewVbdPayload>()
const error = ref<ApiError | Error | undefined>()

const { canRun, run: create, isRunning } = useXoVbdCreateJob(formPayload)

const hasAttachError = computed(() => error.value !== undefined)

const canDisplayForm = computed(() => !isRunning.value && !hasAttachError.value)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vmId) {
    return { name: '/(site)/dashboard' }
  }

  return { name: '/vm/[id]/vdis', params: { id: vmId } }
})

async function attachVdi(newPayload: NewVbdPayload) {
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
