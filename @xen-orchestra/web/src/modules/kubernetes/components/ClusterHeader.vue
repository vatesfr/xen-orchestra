<template>
  <UiHeadBar icon="object:cluster">
    {{ cluster.name }}
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
        <ClusterActions :cluster />
      </MenuList>
    </template>
  </UiHeadBar>
</template>

<script setup lang="ts">
import ClusterActions from '@/modules/kubernetes/components/actions/ClusterActions.vue'
import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  cluster: XoKubernetesCluster
}>()

const { t } = useI18n()
</script>
