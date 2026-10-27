<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel :route="getKubernetesClusterRoute(branch.data.id)" @toggle="branch.toggleCollapse()">
      {{ branch.data.name }}
      <template #icon>
        <VtsObjectIcon
          v-tooltip="branch.data.is_reconciliation_paused ? t('reconciliation-paused') : false"
          :state="branch.data.is_reconciliation_paused ? 'paused' : undefined"
          type="cluster"
          size="medium"
        />
      </template>
      <template #addons>
        <UiLoader
          v-if="isChangingState"
          v-tooltip="{
            placement: 'top',
            content: currentOperation,
          }"
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
          <ClusterActions :cluster="branch.data" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import ClusterActions from '@/modules/kubernetes/components/actions/ClusterActions.vue'
import { useXoKubernetesClusterUtils } from '@/modules/kubernetes/composables/xo-kubernetes-cluster-utils.composable.ts'
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import type { KubernetesClusterBranch } from '@/modules/treeview/types/tree.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: KubernetesClusterBranch
}>()

const { t } = useI18n()

const { isChangingState, currentOperation } = useXoKubernetesClusterUtils(() => branch.data)
</script>
