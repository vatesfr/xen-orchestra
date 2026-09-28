<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel
      icon="object:kubernetes"
      :route="{ name: '/kubernetes/clusters' }"
      @toggle="branch.toggleCollapse()"
    >
      {{ branch.data.name }}
      <template #addons>
        <UiCounter v-tooltip="t('clusters')" :value="clustersCount" accent="brand" variant="secondary" size="small" />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              v-tooltip="{
                placement: 'top',
                content: t('quick-actions'),
              }"
              accent="brand"
              icon="action:more-actions"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <KubernetesTreeActions />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import KubernetesTreeActions from '@/modules/kubernetes/components/actions/KubernetesTreeActions.vue'
import { useXoKubernetesClusterCollection } from '@/modules/kubernetes/remote-resources/use-xo-kubernetes-cluster-collection.ts'
import type { KubernetesBranch } from '@/modules/treeview/types/tree.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  branch: KubernetesBranch
}>()

const { t } = useI18n()

const { clusters } = useXoKubernetesClusterCollection()

const clustersCount = computed(() => clusters.value.length)
</script>
