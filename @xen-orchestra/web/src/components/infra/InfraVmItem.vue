<template>
  <TreeItem v-if="vm !== undefined">
    <TreeItemLabel no-indent route="baz">
      {{ vm.name_label }}
      <template #icon>
        <VmIcon :state="vm.power_state?.toLocaleLowerCase() as POWER_STATE" />
      </template>
      <template #addons>
        <ButtonIcon :icon="faEllipsis" />
      </template>
    </TreeItemLabel>
  </TreeItem>
</template>

<script lang="ts" setup>
import type { Vm } from '@/stores/xo-rest-api/create-xo-store-config'
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import VmIcon from '@core/components/icon/VmIcon.vue'
import TreeItem from '@core/components/tree/TreeItem.vue'
import TreeItemLabel from '@core/components/tree/TreeItemLabel.vue'
import type { POWER_STATE } from '@core/types/power-state.type'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  vm: Vm
}>()
</script>
