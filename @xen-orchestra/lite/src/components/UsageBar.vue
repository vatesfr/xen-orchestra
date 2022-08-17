<template>
  <div>
    <div class="header">
      <slot name="header" />
    </div>
    <template v-if="data !== undefined">
      <ProgressBar
        v-for="item in computedData.sortedArray"
        :key="item.id"
        :value="item.value"
        :label="item.label"
        :badge-label="item.badgeLabel"
      />
      <div class="footer">
        <slot name="footer" :total-percent="computedData.totalPercentUsage" />
      </div>
    </template>
    <UiSpinner v-else class="spinner" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import ProgressBar from "@/components/ProgressBar.vue";
import UiSpinner from "@/components/ui/UiSpinner.vue";

interface Data {
  id: string;
  value: number;
  label?: string;
  badgeLabel?: string;
  maxValue?: number;
}

interface Props {
  data?: Array<Data>;
  nItems?: number;
}

const props = defineProps<Props>();

const computedData = computed(() => {
  const _data = props.data;
  let totalPercentUsage = 0;
  const sortedData = _data
    .map((item) => {
      const value = Math.round((item.value / (item.maxValue ?? 100)) * 100);
      totalPercentUsage += value;
      return {
        ...item,
        value,
      };
    })
    .sort((item, nextItem) => nextItem.value - item.value);
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
</style>

<style>
.progress-bar-component:nth-of-type(2) .progress-bar-fill,
.progress-bar-component:nth-of-type(2) .circle {
  background-color: var(--color-extra-blue-d60);
}
.progress-bar-component:nth-of-type(3) .progress-bar-fill,
.progress-bar-component:nth-of-type(3) .circle {
  background-color: var(--color-extra-blue-d40);
}
.progress-bar-component:nth-of-type(4) .progress-bar-fill,
.progress-bar-component:nth-of-type(4) .circle {
  background-color: var(--color-extra-blue-d20);
}
.progress-bar-component .progress-bar-fill,
.progress-bar-component .circle {
  background-color: var(--color-extra-blue-l20);
}
</style>
