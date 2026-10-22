<template>
  <VtsTreeItem expanded :node-id="leaf.id">
    <UiTreeItemLabel icon="object:node" :route="getKubernetesNodeRoute(leaf.data.id)" no-indent>
      {{ leaf.data.name }}
      <template #addons>
        <VtsIcon
          v-if="isControlPlaneNode(leaf.data)"
          v-tooltip="t('control-plane')"
          name="status:primary-circle"
          size="medium"
        />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              v-tooltip="{
                placement: 'top',
                content: t('quick-actions'),
              }"
              icon="action:more-actions"
              accent="brand"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <NodeActions :node="leaf.data" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import NodeActions from '@/modules/kubernetes/components/actions/node/NodeActions.vue'
import { isControlPlaneNode } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import type { KubernetesNodeLeaf } from '@/modules/treeview/types/tree.type.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  leaf: KubernetesNodeLeaf
}>()

const { t } = useI18n()
</script>
