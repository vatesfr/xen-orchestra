<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :has-children="branch.hasChildren" :node-id="branch.data.id">
    <UiTreeItemLabel icon="object:containers" route="/containers" @toggle="branch.toggleCollapse()">
      {{ t('containers') }}
      <template #addons>
        <UiCounter
          v-tooltip="t('container-host', branch.rawChildren.length)"
          :value="branch.rawChildren.length"
          accent="brand"
          variant="secondary"
          size="small"
        />
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { ContainersBranch } from '@/modules/treeview/types/tree.type.ts'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  branch: ContainersBranch
}>()

const { t } = useI18n()
</script>
