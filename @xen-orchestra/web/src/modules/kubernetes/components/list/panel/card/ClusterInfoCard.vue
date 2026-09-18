<template>
  <UiPanelCard class="cluster-info-card">
    <VtsCardObjectTitle
      :id="cluster.id"
      :label="cluster.name"
      :to="getKubernetesClusterRoute(cluster.id)"
      icon="object:cluster"
    />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="status" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="displayTags.length > 0">
            <VtsTag v-for="tag in displayTags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="displayTags.length > 0" #addons>
          <VtsCopyButton :value="displayTags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ version }}</template>
        <template #addons>
          <VtsCopyButton :value="version" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('cluster-class') }}</template>
        <template #value>{{ clusterClass }}</template>
        <template #addons>
          <VtsCopyButton :value="clusterClass" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('created-on') }}</template>
        <template #value>
          <span v-tooltip="createdAtTooltip ?? false">{{ createdAtFormatted }}</span>
        </template>
        <template v-if="cluster.createdAt" #addons>
          <VtsCopyButton :value="cluster.createdAt" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script setup lang="ts">
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { kubernetesClusterPhaseToStatus } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import { kubernetesTagsToDisplayStrings } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { createdAtFormatted, createdAtTooltip } = useXoKubernetesClusterUtils(() => cluster)

const status = computed(() => kubernetesClusterPhaseToStatus(cluster.phase))

const displayTags = computed(() => kubernetesTagsToDisplayStrings(cluster.tags))

const version = computed(() => '')

const clusterClass = computed(() => '')
</script>

<style scoped lang="postcss">
.cluster-info-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
