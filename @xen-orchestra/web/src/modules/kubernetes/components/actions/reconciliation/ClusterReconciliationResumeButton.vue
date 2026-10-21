<template>
  <MenuItem
    v-if="cluster.is_reconciliation_paused"
    icon="fa:play"
    accent="neutral"
    :disabled="!canResumeReconciliation"
    :busy="isResumingReconciliation"
    @click="resumeReconciliation()"
  >
    {{ t('action:resume-reconciliation') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesClusterReconciliationResume } from '@/modules/kubernetes/composables/use-kubernetes-cluster-reconciliation-resume.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { resumeReconciliation, canResumeReconciliation, isResumingReconciliation } =
  useKubernetesClusterReconciliationResume(() => cluster)
</script>
