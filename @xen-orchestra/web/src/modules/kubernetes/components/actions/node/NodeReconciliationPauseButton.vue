<template>
  <MenuItem
    v-if="!node.is_reconciliation_paused"
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
import { useKubernetesNodeReconciliationPause } from '@/modules/kubernetes/composables/use-kubernetes-node-reconciliation-pause.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { pauseReconciliation, canPauseReconciliation, isPausingReconciliation } = useKubernetesNodeReconciliationPause(
  () => node
)
</script>
