<template>
  <MenuItem icon="fa:eraser" accent="neutral" :disabled="!canDrainNode" :busy="isDrainingNode" @click="drainNode()">
    {{ t('action:drain') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useKubernetesNodeDrain } from '@/modules/kubernetes/composables/use-kubernetes-node-drain.composable.ts'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { node } = defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()

const { drainNode, canDrainNode, isDrainingNode } = useKubernetesNodeDrain(() => node)
</script>
