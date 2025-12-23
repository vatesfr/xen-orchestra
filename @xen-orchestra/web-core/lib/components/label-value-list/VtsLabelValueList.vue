<template>
  <template v-for="(value, label) in fields" :key="label">
    <VtsCardRowKeyValue v-if="isPrimitiveOrBooleanString(value)">
      <template #key>
        <span class="label">{{ label }}</span>
      </template>
      <template #value>
        <template v-if="isBooleanLike(value)">
          <VtsEnabledState :enabled="toBoolean(value)" />
        </template>
        <template v-else>
          {{ value }}
        </template>
      </template>
      <template v-if="!isBooleanLike(value)" #addons>
        <VtsCopyButton :value="String(value)" />
      </template>
    </VtsCardRowKeyValue>
    <VtsLabelValueList v-else :fields="value" />
  </template>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsEnabledState from '@core/components/enabled-state/VtsEnabledState.vue'

defineProps<{
  fields: Record<string, unknown> | unknown
}>()

const isBooleanString = (value: unknown): value is string => value === 'true' || value === 'false'

const isBooleanLike = (value: unknown): boolean => typeof value === 'boolean' || isBooleanString(value)

const toBoolean = (value: unknown): boolean => value === true || value === 'true'

const isPrimitiveOrBooleanString = (value: unknown): boolean =>
  ['number', 'string'].includes(typeof value) || isBooleanString(value)
</script>

<style lang="postcss" scoped>
.label {
  text-transform: capitalize;
}
</style>
