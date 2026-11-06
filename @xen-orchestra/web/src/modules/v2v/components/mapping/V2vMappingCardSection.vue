<template>
  <template v-if="rows.length > 0">
    <VtsDivider type="stretch" />
    <div class="v2v-mapping-card-section">
      <UiPanelCardTitle size="small" :label />
      <VtsCardRowKeyValue v-for="row of rows" :key="row.key">
        <template #key>
          <slot name="key" :row />
        </template>
        <template #value>
          <slot name="value" :row />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </template>
</template>

<script generic="TRow extends { key: string }" lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'

// A section of a mapping card: one row per device of a kind, without the section for a VM without any
defineProps<{
  label: string
  rows: TRow[]
}>()

defineSlots<{
  key(props: { row: TRow }): any
  value(props: { row: TRow }): any
}>()
</script>

<style lang="postcss" scoped>
.v2v-mapping-card-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
</style>
