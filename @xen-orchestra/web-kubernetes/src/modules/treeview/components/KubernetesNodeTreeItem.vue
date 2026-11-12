<template>
  <VtsTreeItem expanded :node-id="leaf.id">
    <UiTreeItemLabel :route="getKubernetesNodeRoute(leaf.data.id)" no-indent>
      {{ leaf.data.name }}
      <template #icon>
        <VtsObjectIcon v-tooltip="iconStateTooltip" :state="iconState" type="node" size="medium" />
      </template>
      <template #addons>
        <UiLoader
          v-if="isChangingState"
          v-tooltip="{
            placement: 'top',
            content: currentOperation,
          }"
        />
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
import { useXoKubernetesNodeCluster } from '@/modules/kubernetes/composables/xo-kubernetes-node-cluster.composable.ts'
import { isControlPlaneNode, nodeIconState } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import { getKubernetesNodeRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import type { KubernetesNodeLeaf } from '@/modules/treeview/types/tree.type.ts'
import type { ObjectState } from '@core/icons'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useMapper } from '@core/packages/mapper'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { leaf } = defineProps<{
  leaf: KubernetesNodeLeaf
}>()

const { t } = useI18n()

const { isChangingState, currentOperation } = useXoKubernetesNodeCluster(() => leaf.data)

const iconState = computed(() => nodeIconState(leaf.data))

const iconStateTooltip = useMapper<ObjectState<'node'> | 'none', string | false>(
  () => iconState.value,
  {
    cordoned: t('cordoned'),
    paused: t('reconciliation-paused'),
    none: false,
  },
  'none'
)
</script>
