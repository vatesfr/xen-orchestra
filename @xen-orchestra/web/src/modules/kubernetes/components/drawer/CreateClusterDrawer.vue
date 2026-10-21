<template>
  <UiDrawer novalidate class="create-cluster-drawer" @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ isEditMode ? t('action:edit-cluster') : t('action:create-new-cluster') }}</template>

    <template #content>
      <div class="create-cluster-form">
        <UiTitle class="section-title">{{ t('general-information') }}</UiTitle>

        <span class="typo-body-regular-small required-hint">{{ t('field:required') }}</span>

        <div class="fields">
          <div class="row">
            <div class="column">
              <ClusterFormTextInput v-bind="nameInputBindings" />
              <VtsInputWrapper v-if="isEditMode" :label="t('tags')">
                <UiTagsList>
                  <VtsTag v-for="tag in clusterTags" :key="tag" :value="tag" />
                </UiTagsList>
              </VtsInputWrapper>
              <ClusterFormTextInput v-else v-bind="tagsInputBindings" />
            </div>
            <FormTextarea v-bind="descriptionInputBindings" />
          </div>

          <UiAlert accent="info" wrap>{{ t('control-plane-replicas-hint') }}</UiAlert>

          <div class="row">
            <ClusterFormNumberInput v-bind="controlPlaneReplicasInputBindings" />
            <ClusterFormNumberInput v-bind="workerReplicasInputBindings" />
          </div>

          <div class="row">
            <ClusterFormTextInput v-bind="controlPlaneIPInputBindings" />
            <ClusterFormTextInput v-bind="vmNamePrefixInputBindings" />
          </div>
        </div>
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ isEditMode ? t('action:save') : t('action:create') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import ClusterFormNumberInput from '@/modules/kubernetes/components/form/create-cluster/inputs/ClusterFormNumberInput.vue'
import ClusterFormTextInput from '@/modules/kubernetes/components/form/create-cluster/inputs/ClusterFormTextInput.vue'
import { useCreateKubernetesClusterForm } from '@/modules/kubernetes/form/create-cluster/use-create-kubernetes-cluster-form.ts'
import type { KubernetesClusterCreatePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-create.job.ts'
import type { KubernetesClusterEditPayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-edit.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { kubernetesTagsToStrings } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import FormTextarea from '@/shared/components/form/FormTextarea.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster?: XoKubernetesCluster
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [KubernetesClusterCreatePayload]
  edit: [KubernetesClusterEditPayload]
}>()

const { t } = useI18n()

const isEditMode = computed(() => cluster !== undefined)

const clusterTags = computed(() => kubernetesTagsToStrings(cluster?.tags ?? null))

const {
  nameInputBindings,
  descriptionInputBindings,
  tagsInputBindings,
  controlPlaneReplicasInputBindings,
  workerReplicasInputBindings,
  controlPlaneIPInputBindings,
  vmNamePrefixInputBindings,
  validateAndBuildPayload,
  validateAndBuildEditPayload,
} = useCreateKubernetesClusterForm(cluster)

async function handleConfirm() {
  if (isEditMode.value) {
    const payload = await validateAndBuildEditPayload()

    if (payload !== undefined) {
      emit('edit', payload)
    }

    return
  }

  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
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
