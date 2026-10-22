<template>
  <MenuItem
    v-if="node.is_cordon"
    icon="fa:play"
    accent="neutral"
    :disabled="!canUncordonNode"
    :busy="isUncordoningNode"
    @click="uncordonNode()"
  >
    {{ t('action:uncordon') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesNodeUncordon } from '@/modules/kubernetes/composables/use-kubernetes-node-uncordon.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { uncordonNode, canUncordonNode, isUncordoningNode } = useKubernetesNodeUncordon(() => node)
</script>
