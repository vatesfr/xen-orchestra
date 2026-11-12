<template>
  <UiCard>
    <UiTitle>
      {{ t('status') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('kubelet')">
        <template #value>
          <KubernetesStatus :status="readyStatus" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('scheduling')">
        <template #value>
          <KubernetesStatus :status="schedulingStatus" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('paused')">
        <template #value>
          <KubernetesPausedStatus :paused="node.is_reconciliation_paused" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import KubernetesPausedStatus from '@/modules/kubernetes/components/KubernetesPausedStatus.vue'
import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { nodeReadyStatus, nodeSchedulingStatus } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const readyStatus = computed(() => nodeReadyStatus(node))

const schedulingStatus = computed(() => nodeSchedulingStatus(node))
</script>
