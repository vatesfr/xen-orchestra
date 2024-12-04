<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <UiObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </UiHeadBar>
  <UiTabList>
    <UiTab disabled>{{ $t('dashboard') }}</UiTab>
    <UiTab selected>{{ $t('console') }}</UiTab>
    <UiTab disabled>{{ $t('alarms') }}</UiTab>
    <UiTab disabled>{{ $t('stats') }}</UiTab>
    <UiTab disabled>{{ $t('system') }}</UiTab>
    <UiTab disabled>{{ $t('network') }}</UiTab>
    <UiTab disabled>{{ $t('storage') }}</UiTab>
    <UiTab disabled>{{ $t('tasks') }}</UiTab>
  </UiTabList>
</template>

<script lang="ts" setup>
import type { XoVm } from '@/types/xo/vm.type'
import type { VmState } from '@core/types/object-icon.type'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiObjectIcon from '@core/components/ui/object-icon/UiObjectIcon.vue'
import UiTab from '@core/components/ui/tab/UiTab.vue'
import UiTabList from '@core/components/ui/tab-list/UiTabList.vue'

defineProps<{
  vm: XoVm
}>()
</script>
