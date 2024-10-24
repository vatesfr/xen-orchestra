<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <UiObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </UiHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <TabItem active>{{ $t('console') }}</TabItem>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <TabItem disabled>{{ $t('system') }}</TabItem>
    <TabItem disabled>{{ $t('network') }}</TabItem>
    <TabItem disabled>{{ $t('storage') }}</TabItem>
    <TabItem disabled>{{ $t('tasks') }}</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import type { XoVm } from '@/types/xo/vm.type'
import type { VmState } from '@core/types/object-icon.type'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'

defineProps<{
  vm: XoVm
}>()
</script>
