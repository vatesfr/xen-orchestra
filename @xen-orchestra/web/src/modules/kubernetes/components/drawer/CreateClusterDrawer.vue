<template>
  <UiDrawer class="create-cluster-drawer" @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ t('action:create-new-cluster') }}</template>

    <template #content>
      <div class="create-cluster-form">
        <UiTitle class="section-title">{{ t('general-information') }}</UiTitle>

        <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

        <div class="fields">
          <div class="row">
            <div class="column">
              <NewClusterFormTextInput v-bind="nameInputBindings" />
              <NewClusterFormTextInput v-bind="tagsInputBindings" />
            </div>
            <FormTextarea v-bind="descriptionInputBindings" disabled />
          </div>

          <UiAlert accent="info" wrap>{{ t('control-plane-replicas-hint') }}</UiAlert>

          <div class="row">
            <NewClusterFormNumberInput v-bind="controlPlaneReplicasInputBindings" />
            <NewClusterFormNumberInput v-bind="workerReplicasInputBindings" />
          </div>

          <div class="row">
            <NewClusterFormTextInput v-bind="controlPlaneIPInputBindings" />
            <NewClusterFormTextInput v-bind="vmNamePrefixInputBindings" />
          </div>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import NewClusterFormNumberInput from '@/modules/kubernetes/components/form/create-cluster/inputs/ClusterFormNumberInput.vue'
import NewClusterFormTextInput from '@/modules/kubernetes/components/form/create-cluster/inputs/ClusterFormTextInput.vue'
import { useCreateKubernetesClusterForm } from '@/modules/kubernetes/form/create-cluster/use-create-kubernetes-cluster-form.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const emit = defineEmits<{
  cancel: []
  confirm: [KubernetesClusterCreatePayload]
}>()

const { t } = useI18n()

const {
  nameInputBindings,
  descriptionInputBindings,
  tagsInputBindings,
  controlPlaneReplicasInputBindings,
  workerReplicasInputBindings,
  controlPlaneIPInputBindings,
  vmNamePrefixInputBindings,
  validateAndBuildPayload,
} = useCreateKubernetesClusterForm()

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload === undefined) {
    return
  }

  emit('confirm', payload)
}
</script>

<style lang="postcss" scoped>
.create-cluster-drawer {
  .section-title {
    margin-block-end: 2.4rem;
  }

  .required-hint::before {
    content: '* ';
    color: var(--color-brand-txt-base);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    margin-block-start: 2.4rem;
  }

  .row {
    display: flex;
    align-items: start;
    flex-direction: column;
    gap: 2.4rem;

    & > * {
      width: 100%;
      min-width: 0;
    }

    @media (--medium-or-large) {
      flex-direction: row;
      max-width: 88rem;

      & > * {
        width: calc(50% - 1.2rem);
      }
    }
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }
}
</style>
