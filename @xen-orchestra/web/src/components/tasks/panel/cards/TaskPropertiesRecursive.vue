<template>
  <div class="content">
    <template v-for="(value, key) in data" :key="key">
      <VtsCardRowKeyValue v-if="isPrimitive(value)">
        <template #key>{{ key }}</template>
        <template v-if="typeof value !== 'boolean'" #value>{{ value }}</template>
        <template v-else #value>
          <VtsEnabledState :enabled="value as boolean" />
        </template>
        <template v-if="typeof value !== 'boolean'" #addons>
          <VtsCopyButton :value="String(value)" />
        </template>
      </VtsCardRowKeyValue>

      <div v-else>
        <TaskPropertiesRecursive :data="value as Record<string, unknown>" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'

defineProps<{
  data: Record<string, unknown> | unknown[] | null
}>()

const isPrimitive = (value: unknown) => value === null || typeof value !== 'object'
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
</style>
