<template>
  <UiHeadBar icon="object:node">
    {{ node.name }}
    <template v-if="isControlPlaneNode(node)" #status>
      <VtsIcon v-tooltip="t('control-plane')" name="status:primary-circle" size="medium" />
    </template>
    <template #actions>
      <MenuList placement="bottom-end">
        <template #trigger="{ open }">
          <UiButtonIcon
            v-tooltip="{
              placement: 'left',
              content: t('more-actions'),
            }"
            icon="action:more-actions"
            accent="brand"
            size="medium"
            @click="open($event)"
          />
        </template>
        <NodeActions :node />
      </MenuList>
    </template>
  </UiHeadBar>
  <TabList>
    <RouterLink
      v-slot="{ isActive, href }"
      :to="{ name: '/kubernetes/node/[id]/system', params: { id: node.id } }"
      custom
    >
      <UiTabItem :active="isActive" :href tag="a">
        {{ t('system') }}
      </UiTabItem>
    </RouterLink>
  </TabList>
</template>

<script setup lang="ts">
import NodeActions from '@/modules/kubernetes/components/actions/node/NodeActions.vue'
import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { isControlPlaneNode } from '@/modules/kubernetes/utils/kubernetes-node.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import TabList from '@core/components/tab-list/TabList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTabItem from '@core/components/ui/tab-item/UiTabItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  node: XoKubernetesNode
}>()

const { t } = useI18n()
</script>
