<template>
  <VtsTreeItem expanded :node-id="leaf.dataId">
    <UiTreeItemLabel :route="{ name: '/vm/[uuid]', params: { uuid: leaf.data.uuid } }" no-indent>
      {{ leaf.data.name_label || '(VM)' }}
      <template #icon>
        <VtsObjectIcon size="medium" :state="powerState" type="vm" />
      </template>
      <template #addons>
        <UiLoader v-if="isChangingState" v-tooltip="{ placement: 'top', content: currentOperation }" />
        <MenuList placement="bottom-start">
          <template #trigger="{ open, isOpen }">
            <UiButtonIcon
              v-tooltip="{ placement: 'top', content: t('quick-actions') }"
              icon="action:more-actions"
              accent="brand"
              size="small"
              :selected="isOpen"
              @click="open($event)"
            />
          </template>
          <VmTreeActions :vm-opaque-ref="leaf.data.$ref" />
        </MenuList>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import type { VM_POWER_STATE } from '@/libs/xen-api/xen-api.enums.ts'
import type { VmLeaf } from '@/modules/treeview/types/tree.type.ts'
import VmTreeActions from '@/modules/vm/components/actions/VmTreeActions.vue'
import { useVmOperation } from '@/modules/vm/composables/vm-operation.composable.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsObjectIcon from '@core/components/object-icon/VtsObjectIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { leaf } = defineProps<{
  leaf: VmLeaf
}>()

const { t } = useI18n()

const { isChangingState, currentOperation } = useVmOperation(() => leaf.data)

const powerState = computed(() => leaf.data.power_state.toLowerCase() as Lowercase<VM_POWER_STATE>)
</script>
