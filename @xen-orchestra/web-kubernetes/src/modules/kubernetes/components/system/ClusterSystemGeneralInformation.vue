<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="cluster.name" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="cluster.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="cluster.description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="displayTags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in displayTags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('version')" :value="version" />
      <VtsTabularKeyValueRow :label="t('created-on')">
        <template #value>
          <span v-tooltip="createdAtTooltip">{{ createdAtFormatted }}</span>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('created-by')" :value="creatorLabel" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useKubernetesClusterCreator } from '@/modules/kubernetes/composables/use-kubernetes-cluster-creator.composable.ts'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { clusterVersion } from '@/modules/kubernetes/utils/kubernetes-cluster.util.ts'
import { kubernetesTagsToStrings } from '@/modules/kubernetes/utils/kubernetes-tags.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { createdAtFormatted, createdAtTooltip } = useXoKubernetesClusterUtils(() => cluster)

const { creatorLabel } = useKubernetesClusterCreator(() => cluster)

const displayTags = computed(() => kubernetesTagsToStrings(cluster.tags))

const version = computed(() => clusterVersion(cluster))
</script>
