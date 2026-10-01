<template>
  <UiHeadBar icon="fa:edit">
    {{ t('edit-vif') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!areVifsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vif" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: vifUuid }) }}
    </VtsStateHero>

    <template v-else>
      <VtsOperationPendingCard v-if="isRunning" :title="t('editing-vif')" />
      <VtsOperationErrorCard
        v-else-if="error"
        :title="t('unable-to-edit-vif')"
        :error
        :error-message="t('edit-vif:error-message')"
      >
        <template #actions>
          <UiButton variant="secondary" accent="brand" size="medium" @click="handleGoBack()">
            {{ t('action:go-back') }}
          </UiButton>
        </template>
      </VtsOperationErrorCard>
      <UiCard v-show="canDisplayForm">
        <UiTitle>{{ t('configuration') }}</UiTitle>
        <EditVifForm :vif :cancel-to="cancelRoute" @save="editVif" />
      </UiCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types.ts'
import EditVifForm from '@/modules/vif/components/form/edit/EditVifForm.vue'
import { type EditVifPayload, useVifEditJob } from '@/modules/vif/jobs/vif-edit.job.ts'
import { useVifStore } from '@/stores/xen-api/vif.store.ts'
import { useVmStore } from '@/stores/xen-api/vm.store.ts'
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
const route = useRoute<'/vif/[uuid]/edit'>()

const { isReady: areVifsReady, getByUuid: getVifByUuid } = useVifStore().subscribe()
const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()

const vifUuid = computed(() => route.params.uuid as XenApiVif['uuid'])

const vif = computed(() => getVifByUuid(vifUuid.value))

const vm = computed(() => (vif.value === undefined ? undefined : getVmByOpaqueRef(vif.value.VM)))

const formPayload = ref<EditVifPayload>()

const error = ref<Error | undefined>()

const { canRun, run: edit, isRunning } = useVifEditJob(() => (vif.value === undefined ? [] : [vif.value]), formPayload)

const canDisplayForm = computed(() => !isRunning.value && error.value === undefined)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vm.value) {
    return { name: '/' }
  }

  return { name: '/vm/[uuid]/network', params: { uuid: vm.value.uuid } }
})

async function editVif(payload: EditVifPayload) {
  formPayload.value = payload

  if (!canRun.value) {
    return
  }

  try {
    const [promiseResult] = await edit()

    if (promiseResult.status === 'rejected') {
      throw promiseResult.reason
    }

    await router.push(cancelRoute.value)
  } catch (_error) {
    error.value = _error as Error
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
