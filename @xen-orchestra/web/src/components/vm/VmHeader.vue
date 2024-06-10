<template>
  <div class="vm-header">
    <ObjectIcon :state size="medium" type="vm" />
    <h4 v-tooltip class="typo h4-medium title">{{ name }}</h4>
  </div>
  <TabList>
    <TabItem disabled>Dashboard</TabItem>
    <TabItem active>Console</TabItem>
    <TabItem disabled>Alarms</TabItem>
    <TabItem disabled>Stats</TabItem>
    <TabItem disabled>System</TabItem>
    <TabItem disabled>Network</TabItem>
    <TabItem disabled>Storage</TabItem>
    <TabItem disabled>Tasks</TabItem>
  </TabList>
</template>

<script lang="ts" setup>
import type { VmState } from '@core/types/object-icon.type'
import ObjectIcon from '@core/components/icon/ObjectIcon.vue'
import TabItem from '@core/components/tab/TabItem.vue'
import TabList from '@core/components/tab/TabList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'

defineProps<{
  name?: string
  state?: VmState
}>()
</script>

<style lang="postcss" scoped>
.vm-header {
  padding: 1.6rem;
  display: flex;
  gap: 1.6rem;
  align-items: center;
  border-bottom: 0.1rem solid var(--color-grey-500);
  background-color: var(--background-color-primary);
}

.title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
