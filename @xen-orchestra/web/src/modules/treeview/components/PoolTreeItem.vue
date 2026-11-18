<template>
  <VtsTreeItem :expanded="!branch.isCollapsed" :node-id="branch.data.id" :has-children="branch.hasChildren">
    <UiTreeItemLabel icon="object:pool" :route="`/pool/${branch.data.id}`" @toggle="branch.toggleCollapse()">
      <span :class="{ stale: isStale }">{{ branch.data.name_label }}</span>
      <template #addons>
        <StaleObjectTag :object="branch.data" />
        <UiCounter
          v-tooltip="t('running-vm', runningVmsCount)"
          :value="runningVmsCount"
          accent="brand"
          variant="secondary"
          size="small"
        />
        <VtsActionsMenu v-if="!isStale" placement="bottom-start">
          <PoolTreeActions :pool="branch.data" />
        </VtsActionsMenu>
      </template>
    </UiTreeItemLabel>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import PoolTreeActions from '@/modules/pool/components/actions/PoolTreeActions.vue'
import type { PoolBranch } from '@/modules/treeview/types/tree.type.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import StaleObjectTag from '@/shared/components/stale-object/StaleObjectTag.vue'
import { useStaleObject } from '@/shared/composables/stale-object.composable.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { branch } = defineProps<{
  branch: PoolBranch
}>()

const { t } = useI18n()

const { isStale } = useStaleObject(() => branch.data)

const { runningVmsCountByPool } = useXoVmCollection()

const runningVmsCount = computed(() => runningVmsCountByPool.value.get(branch.data.id) ?? 0)
</script>

<style lang="postcss" scoped>
/* object of a disconnected pool, kept by XO but possibly outdated */
.stale {
  opacity: 0.5;
}
</style>
