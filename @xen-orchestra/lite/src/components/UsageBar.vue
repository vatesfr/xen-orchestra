<template>
  <div>
    <div class="header">
      <slot name="header" />
    </div>
    <div v-if="data !== undefined">
      <div
        v-for="item in computedData.sortedArray"
        :key="item.id"
        class="progress-item"
      >
        <UiProgressBar :value="item.value" color="custom" />
        <div class="legend">
          <span class="circle" />
          {{ item.label }}
          <UiBadge class="badge">{{
            item.badgeLabel ?? `${item.value}%`
          }}</UiBadge>
        </div>
      </div>
      <div class="footer">
        <slot :total-percent="computedData.totalPercentUsage" name="footer" />
      </div>
    </div>
    <UiSpinner v-else class="spinner" />
  </div>
</template>

<script lang="ts" setup>
import UiBadge from "@/components/ui/UiBadge.vue";
import UiProgressBar from "@/components/ui/UiProgressBar.vue";
import { computed } from "vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";

interface Data {
  id: string;
  value: number;
  label?: string;
  badgeLabel?: string;
  maxValue?: number;
}

interface Props {
  data?: Data[];
  nItems?: number;
}

const props = defineProps<Props>();

const computedData = computed(() => {
  const _data = props.data;
  let totalPercentUsage = 0;
  return {
    sortedArray: _data
      ?.map((item) => {
        const value = Math.round((item.value / (item.maxValue ?? 100)) * 100);
        totalPercentUsage += value;
        return {
          ...item,
          value,
        };
      })
      .sort((item, nextItem) => nextItem.value - item.value)
      .slice(0, props.nItems ?? _data.length),
    totalPercentUsage,
  };
});
</script>

<style scoped>
.header {
  color: var(--color-extra-blue-base);
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-extra-blue-base);
  margin-bottom: 2rem;
  font-size: 16px;
  font-weight: 700;
}
.footer {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-blue-scale-300);
}

.spinner {
  color: var(--color-extra-blue-base);
  display: flex;
  margin: auto;
  width: 40px;
  height: 40px;
}

.legend {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin: 1.6em 0;
  text-align: right;
}

.badge {
  font-size: 0.9em;
  font-weight: 700;
}

.progress-item {
  --progress-bar-height: 1.2rem;
  --progress-bar-color: var(--color-extra-blue-l20);
  --progress-bar-background-color: var(--color-blue-scale-400);
}

.progress-item:nth-child(1) {
  --progress-bar-color: var(--color-extra-blue-d60);
}

.progress-item:nth-child(2) {
  --progress-bar-color: var(--color-extra-blue-d40);
}

.progress-item:nth-child(3) {
  --progress-bar-color: var(--color-extra-blue-d20);
}

.circle {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-radius: 0.5rem;
  background-color: var(--progress-bar-color);
}
</style>
