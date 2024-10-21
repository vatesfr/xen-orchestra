<template>
  <HeadBar>
    {{ vm.name_label }}
    <template #icon>
      <ObjectIcon :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </HeadBar>
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
import HeadBar from '@core/components/head-bar/HeadBar.vue'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import VtsTabItem from '@core/components/tab/VtsTabItem.vue'
import VtsTabList from '@core/components/tab/VtsTabList.vue'

defineProps<{
  vm: XoVm
}>()
</script>
