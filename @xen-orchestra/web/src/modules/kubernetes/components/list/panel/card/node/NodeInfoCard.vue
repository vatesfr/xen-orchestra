<template>
  <UiPanelCard class="node-info-card">
    <UiPanelCardTitle :id="node.node_id" size="medium" :label="node.name" :to="nodeRoute" icon="object:node" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('node-name') }}</template>
        <template #value>{{ node.node_name }}</template>
        <template #addons>
          <VtsCopyButton :value="node.node_name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="readyStatus" />
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
import { useXoKubernetesNodeCluster } from '@/modules/kubernetes/composables/xo-kubernetes-node-cluster.composable.ts'
import { useXoKubernetesNodeUtils } from '@/modules/kubernetes/composables/xo-kubernetes-node-utils.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode, nodeReadyStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
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
