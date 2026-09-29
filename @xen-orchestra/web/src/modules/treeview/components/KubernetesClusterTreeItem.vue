<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      icon="object:cluster"
      :route="getKubernetesClusterRoute(branch.dataId)"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name }}
      <template #addons>
        <MenuList placement="bottom-start">
          <template #trigger="{ open }">
            <UiButtonIcon
              v-tooltip="{
                placement: 'top',
                content: t('quick-actions'),
              }"
              icon="action:more-actions"
              accent="brand"
              size="small"
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
import { getKubernetesClusterRoute } from '@/modules/kubernetes/utils/kubernetes-routes.util.ts'
import type { KubernetesClusterBranch } from '@/modules/treeview/types/tree.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  branch: KubernetesClusterBranch
}>()

const { t } = useI18n()
</script>
