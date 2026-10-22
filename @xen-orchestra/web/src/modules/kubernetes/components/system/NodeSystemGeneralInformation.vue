<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="node.name" />
      <VtsTabularKeyValueRow :label="t('uuid')" :value="node.node_id" />
      <VtsTabularKeyValueRow :label="t('role')" :value="roleLabel" />
      <VtsTabularKeyValueRow :label="t('cluster')">
        <template #value>
          <UiLink size="medium" :to="clusterRoute" icon="object:cluster">
            {{ clusterLabel }}
          </UiLink>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('kubernetes-version')" :value="node.version" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoKubernetesNodeCluster } from '@/modules/kubernetes/composables/xo-kubernetes-node-cluster.composable.ts'
import { useXoKubernetesNodeUtils } from '@/modules/kubernetes/composables/xo-kubernetes-node-utils.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { roleLabels } = useXoKubernetesNodeUtils()

const roleLabel = computed(() => roleLabels.value[node.role])

const { clusterRoute, clusterLabel } = useXoKubernetesNodeCluster(() => node)
</script>
