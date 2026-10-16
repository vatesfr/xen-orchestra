<template>
  <UiHeadBar icon="object:node">
    {{ node.name }}
    <template v-if="isControlPlaneNode(node)" #status>
      <VtsIcon v-tooltip="t('control-plane')" name="status:primary-circle" size="medium" />
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()
</script>
