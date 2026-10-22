<template>
  <MenuItem
    v-if="!node.is_cordon"
    icon="fa:pause"
    accent="neutral"
    :disabled="!canCordonNode"
    :busy="isCordoningNode"
    @click="cordonNode()"
  >
    {{ t('action:cordon') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesNodeCordon } from '@/modules/kubernetes/composables/use-kubernetes-node-cordon.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { cordonNode, canCordonNode, isCordoningNode } = useKubernetesNodeCordon(() => node)
</script>
