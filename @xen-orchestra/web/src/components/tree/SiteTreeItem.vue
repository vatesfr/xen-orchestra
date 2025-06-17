<template>
  <VtsTreeItem :expanded="branch.isExpanded">
    <UiTreeItemLabel :icon="faSatellite" route="/" @toggle="branch.toggleExpand()">
      {{ branch.data.name_label }}
      <template #addons>
        <UiCounter
          v-tooltip="t('running-vm', runningVmsCount)"
          :value="runningVmsCount"
          accent="brand"
          variant="secondary"
          size="small"
        />
      </template>
    </UiTreeItemLabel>
    <template v-if="branch.hasChildren" #sublist>
      <PoolTreeList :branches="branch.children" />
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import PoolTreeList from '@/components/tree/PoolTreeList.vue'
import { useVmStore } from '@/stores/xo-rest-api/vm.store.ts'
import type { SiteBranch } from '@/types/tree.type'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiTreeItemLabel from '@core/components/ui/tree-item-label/UiTreeItemLabel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faSatellite } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  branch: SiteBranch
}>()

const { t } = useI18n()

const { runningVms } = useVmStore().subscribe()

const runningVmsCount = computed(() => runningVms.value.length)
</script>
