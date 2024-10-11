<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <UiObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </UiHeadBar>
  <VtsTabList>
    <VtsTabItem disabled>{{ $t('dashboard') }}</VtsTabItem>
    <VtsTabItem selected>{{ $t('console') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('alarms') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('stats') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('system') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('network') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('storage') }}</VtsTabItem>
    <VtsTabItem disabled>{{ $t('tasks') }}</VtsTabItem>
  </VtsTabList>
</template>

<script lang="ts" setup>
import type { XoVm } from '@/types/xo/vm.type'
import type { VmState } from '@core/types/object-icon.type'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'

defineProps<{
  vm: XoVm
}>()
</script>
