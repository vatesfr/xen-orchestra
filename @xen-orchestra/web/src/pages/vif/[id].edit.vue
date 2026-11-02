<template>
  <UiHeadBar icon="fa:edit">
    {{ t('edit-vif') }}
  </UiHeadBar>

  <div class="card-container">
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

    <VtsStateHero v-else-if="!areVifsReady" format="page" type="busy" size="large" />

    <VtsStateHero v-else-if="!vif" format="page" type="not-found" size="large">
      {{ t('object-not-found', { id: route.params.id }) }}
    </VtsStateHero>

    <UiCard v-if="vif" v-show="canDisplayForm">
      <UiTitle>{{ t('configuration') }}</UiTitle>
      <EditVifForm :vif :cancel-to="cancelRoute" @save="editVif" />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import EditVifForm from '@/modules/vif/components/form/edit/EditVifForm.vue'
import { type EditVifPayload, useXoVifEditJob } from '@/modules/vif/jobs/xo-vif-edit.job.ts'
import { type FrontXoVif, useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
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
const route = useRoute<'/vif/[id].edit'>()

const { areVifsReady, useGetVifById } = useXoVifCollection()

const vif = useGetVifById(() => route.params.id as FrontXoVif['id'])

const formPayload = ref<EditVifPayload>()

const error = ref<ApiError | Error | undefined>()

const editedVif = ref<FrontXoVif>()

const { canRun, run: edit, isRunning } = useXoVifEditJob(editedVif, formPayload)

const canDisplayForm = computed(() => !isRunning.value && error.value === undefined)

const cancelRoute = computed<RouteLocationRaw>(() => {
  if (!vif.value) {
    return { name: '/(site)/dashboard' }
  }

  return { name: '/vm/[id]/networks', params: { id: vif.value.$VM } }
})

async function editVif(payload: EditVifPayload) {
  editedVif.value = vif.value
  formPayload.value = payload

  if (!canRun.value) {
    return
  }

  const redirectRoute = cancelRoute.value

  try {
    await edit()

    await router.push(redirectRoute)
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
