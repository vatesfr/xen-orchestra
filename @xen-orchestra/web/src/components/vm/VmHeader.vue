<template>
  <HeadBar>
    {{ vm.name_label }}
    <template #icon>
      <ObjectIcon :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </HeadBar>
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
import HeadBar from '@core/components/head-bar/HeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'

defineProps<{
  vm: XoVm
}>()
</script>
