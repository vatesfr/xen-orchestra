<template>
  <UiPanelCard class="node-info-card">
    <UiPanelCardTitle :id="node.id" size="medium" :label="node.name" :to="nodeRoute" icon="object:node" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('node-name') }}</template>
        <template #value>{{ node.node_name }}</template>
        <template v-if="node.node_name" #addons>
          <VtsCopyButton :value="node.node_name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <KubernetesStatus :status="readyStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('paused') }}</template>
        <template #value>
          <KubernetesPausedStatus :paused="node.is_reconciliation_paused" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ node.version }}</template>
        <template v-if="node.version" #addons>
          <VtsCopyButton :value="node.version" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('role') }}</template>
        <template #value>
          <div class="value">
            <VtsIcon
              v-if="isControlPlaneNode(node)"
              v-tooltip="t('control-plane')"
              name="status:primary-circle"
              size="medium"
            />
            {{ roleLabel }}
          </div>
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('vm') }}</template>
        <template #value>
          <div v-if="vm" class="value">
            <UiLink size="small" :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }" icon="object:vm">
              {{ vm.name_label }}
            </UiLink>
          </div>
          <template v-else>{{ node.vm_id }}</template>
        </template>
        <template v-if="vmLabel" #addons>
          <VtsCopyButton :value="vmLabel" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('cluster') }}</template>
        <template #value>
          <div class="value">
            <UiLink size="small" :to="clusterRoute" icon="object:cluster">
              {{ clusterLabel }}
            </UiLink>
          </div>
        </template>
        <template #addons>
          <VtsCopyButton :value="clusterLabel" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import KubernetesPausedStatus from '@/modules/kubernetes/components/KubernetesPausedStatus.vue'
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import { useXoKubernetesNodeCluster } from '@/modules/kubernetes/composables/xo-kubernetes-node-cluster.composable.ts'
import { useXoKubernetesNodeUtils } from '@/modules/kubernetes/composables/xo-kubernetes-node-utils.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode, nodeReadyStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const nodeRoute = computed(() => getKubernetesNodeRoute(node.id))

const readyStatus = computed(() => nodeReadyStatus(node))

const { roleLabels } = useXoKubernetesNodeUtils()

const roleLabel = computed(() => roleLabels.value[node.role])

const { clusterRoute, clusterLabel } = useXoKubernetesNodeCluster(() => node)

const { getVmById } = useXoVmCollection()

const vm = computed(() => getVmById(node.vm_id))

const vmLabel = computed(() => vm.value?.name_label ?? node.vm_id)
</script>

<style scoped lang="postcss">
.node-info-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
  }
}
</style>
