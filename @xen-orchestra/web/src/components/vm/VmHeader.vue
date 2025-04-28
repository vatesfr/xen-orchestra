<template>
  <UiHeadBar>
    {{ vm.name_label }}
    <template #icon>
      <UiObjectIcon size="medium" :state="vm.power_state.toLocaleLowerCase() as VmState" type="vm" />
    </template>
  </UiHeadBar>
  <TabList>
    <TabItem disabled>{{ $t('dashboard') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/console`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('console') }}
      </TabItem>
    </RouterLink>
    <TabItem disabled>{{ $t('alarms') }}</TabItem>
    <TabItem disabled>{{ $t('stats') }}</TabItem>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/system`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('system') }}
      </TabItem>
    </RouterLink>
    <RouterLink v-slot="{ isActive, href }" :to="`/vm/${vm.id}/networks`" custom>
      <TabItem :active="isActive" :href tag="a">
        {{ $t('network') }}
      </TabItem>
    </RouterLink>
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
