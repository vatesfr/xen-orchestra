<template>
  <MenuItem accent="brand" icon="action:change-state">
    {{ t('action:change-state') }}
    <template #submenu>
      <NodeReconciliationPauseButton :node />
      <NodeReconciliationResumeButton :node />
    </template>
  </MenuItem>
  <NodeCordonButton :node />
  <NodeUncordonButton :node />
  <NodeDrainButton :node />
</template>

<script lang="ts" setup>
import NodeCordonButton from '@/modules/kubernetes/components/actions/node/NodeCordonButton.vue'
import NodeDrainButton from '@/modules/kubernetes/components/actions/node/NodeDrainButton.vue'
import NodeReconciliationPauseButton from '@/modules/kubernetes/components/actions/node/NodeReconciliationPauseButton.vue'
import NodeReconciliationResumeButton from '@/modules/kubernetes/components/actions/node/NodeReconciliationResumeButton.vue'
import NodeUncordonButton from '@/modules/kubernetes/components/actions/node/NodeUncordonButton.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()
</script>
