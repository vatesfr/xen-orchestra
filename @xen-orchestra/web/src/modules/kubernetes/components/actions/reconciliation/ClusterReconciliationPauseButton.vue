<template>
  <MenuItem
    v-if="!cluster.is_reconciliation_paused"
    icon="fa:pause"
    accent="warning"
    :disabled="!canPauseReconciliation"
    :busy="isPausingReconciliation"
    @click="pauseReconciliation()"
  >
    {{ t('action:pause-reconciliation') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesClusterReconciliationPause } from '@/modules/kubernetes/composables/use-kubernetes-cluster-reconciliation-pause.composable.ts'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { cluster } = defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()

const { pauseReconciliation, canPauseReconciliation, isPausingReconciliation } =
  useKubernetesClusterReconciliationPause(() => cluster)
</script>
