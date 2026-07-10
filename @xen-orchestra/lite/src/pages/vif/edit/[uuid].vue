<template>
  <UiHeadBar icon="fa:plus">
    {{ t('edit-vif:edit') }}
  </UiHeadBar>

  <div class="card-container">
    <VtsStateHero v-if="!uuid || !vm || !selectedVif" type="not-found" format="page" size="medium" />
    <VtsOperationPendingCard v-else-if="isRunning" :title="t('edit-vif:updating')" />
    <VtsOperationErrorCard
      v-else-if="hasVifCreationError && error"
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
    <UiCard v-else v-show="canDisplayForm">
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <EditVifForm :vm-ref="vm.$ref" :vif-ref="selectedVif.$ref" :cancel-to="cancelRoute" @edit="editVif" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types'
import EditVifForm from '@/modules/vif/components/form/edit/EditVifForm.vue'
import { useXenApiVifEditJob, type EditVifPayload } from '@/modules/vif/jobs/xen-api-vif-edit.job'
import { useVifStore } from '@/stores/xen-api/vif.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsOperationErrorCard from '@core/components/operation-error-card/VtsOperationErrorCard.vue'
import VtsOperationPendingCard from '@core/components/operation-pending-card/VtsOperationPendingCard.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

const router = useRouter()
const route = useRoute<'/vif/edit/[uuid]'>()

const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()
const { getByUuid, getByOpaqueRef: getVifByOpaqueRef } = useVifStore().subscribe()

const { t } = useI18n()

const uuid = computed(() => route.params.uuid as XenApiVif['uuid'] | undefined)
const selectedVif = computed(() => (uuid.value ? getByUuid(uuid.value) : undefined))

const vm = computed(() => {
  const vif = selectedVif.value
  return vif === undefined ? undefined : getVmByOpaqueRef(vif.VM)
})

const error = ref<Error | undefined>()
const formPayload = ref<EditVifPayload>()

const { canRun, run: edit, isRunning } = useXenApiVifEditJob(formPayload)

const hasVifCreationError = computed(() => error.value !== undefined)
const canDisplayForm = computed(() => !isRunning.value && !hasVifCreationError.value)

const cancelRoute = computed<RouteLocationRaw>(() =>
  vm.value
    ? {
        name: '/vm/[uuid]/network',
        params: { uuid: vm.value.uuid },
        query: selectedVif.value ? { id: selectedVif.value?.uuid } : {},
      }
    : { name: '/' }
)

function handleGoBack() {
  error.value = undefined
}

async function editVif(payload: EditVifPayload) {
  formPayload.value = payload

  if (!canRun.value) {
    return
  }

  try {
    const newVifRef = await edit()

    const newVif = getVifByOpaqueRef(newVifRef)
    const targetVm = newVif ? getVmByOpaqueRef(newVif.VM) : undefined

    if (targetVm && newVif) {
      await router.push({ name: '/vm/[uuid]/network', params: { uuid: targetVm.uuid }, query: { id: newVif.uuid } })
    }
  } catch (_error) {
    error.value = _error as Error
  }
}
</script>

<style lang="postcss" scoped>
.card-container {
  margin: 0.8rem;
}
</style>
