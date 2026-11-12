<template>
  <UiDrawer class="upgrade-cluster-drawer" @dismiss="emit('cancel')" @confirm="handleConfirm()">
    <template #title>{{ t('action:upgrade-cluster') }}</template>

    <template #content>
      <div class="content">
        <p class="typo-body-regular-small">{{ t('upgrade-cluster-description') }}</p>

        <VtsCardRowKeyValue>
          <template #key>{{ t('current-version') }}</template>
          <template #value>
            <code>{{ currentVersion }}</code>
          </template>
        </VtsCardRowKeyValue>

        <ClusterFormSelect v-bind="versionSelectBindings" class="version-select" />
      </div>
    </template>

    <template #buttons>
      <VtsOverlayCancelButton @click="emit('cancel')" />
      <VtsOverlayConfirmButton>{{ t('action:upgrade') }}</VtsOverlayConfirmButton>
    </template>
  </UiDrawer>
</template>

<script setup lang="ts">
import ClusterFormSelect from '@/modules/kubernetes/components/form/create-cluster/inputs/ClusterFormSelect.vue'
import { useUpgradeKubernetesClusterForm } from '@/modules/kubernetes/form/upgrade-cluster/use-upgrade-kubernetes-cluster-form.ts'
import type { KubernetesClusterUpgradePayload } from '@/modules/kubernetes/jobs/xo-kubernetes-cluster-upgrade.job.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersion } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsOverlayCancelButton from '@core/components/overlay/VtsOverlayCancelButton.vue'
import VtsOverlayConfirmButton from '@core/components/overlay/VtsOverlayConfirmButton.vue'
import UiDrawer from '@core/components/ui/drawer/UiDrawer.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [KubernetesClusterUpgradePayload]
}>()

const { t } = useI18n()

const currentVersion = computed(() => clusterVersion(cluster))

const { versionSelectBindings, validateAndBuildPayload } = useUpgradeKubernetesClusterForm(() => cluster)

async function handleConfirm() {
  const payload = await validateAndBuildPayload()

  if (payload !== undefined) {
    emit('confirm', payload)
  }
}
</script>

<style lang="postcss" scoped>
.upgrade-cluster-drawer {
  .content {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  /* Same width as a field of the create cluster drawer: half of a 88rem row, minus half of the 2.4rem gap */
  .version-select {
    width: 100%;

    @media (--medium-or-large) {
      max-width: calc(44rem - 1.2rem);
    }
  }
}
</style>
