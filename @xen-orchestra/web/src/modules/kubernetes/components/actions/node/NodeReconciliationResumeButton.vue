<template>
  <MenuItem
    v-if="node.is_reconciliation_paused"
    icon="fa:play"
    accent="neutral"
    :disabled="!canResumeReconciliation"
    :busy="isResumingReconciliation"
    @click="resumeReconciliation()"
  >
    {{ t('action:resume') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesNodeReconciliationResume } from '@/modules/kubernetes/composables/use-kubernetes-node-reconciliation-resume.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { resumeReconciliation, canResumeReconciliation, isResumingReconciliation } =
  useKubernetesNodeReconciliationResume(() => node)
</script>
