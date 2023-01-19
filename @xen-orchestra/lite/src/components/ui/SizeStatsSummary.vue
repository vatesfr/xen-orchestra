<template>
  <div class="summary" v-if="isDisplayed">
    <div class="summary-card">
      <p>{{ $t("total-used") }}:</p>
      <div class="summary-value">
        <p>{{ percentUsed }}%</p>
        <p>
          {{ formatSize(usage) }}
        </p>
      </div>
    </div>
    <div class="summary-card">
      <p>{{ $t("total-free") }}:</p>
      <div class="summary-value">
        <p>{{ percentFree }}%</p>
        <p>
          {{ formatSize(free) }}
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { formatSize, percent } from "@/libs/utils";
import { computed } from "vue";
const props = defineProps<{
  size: number;
  usage: number;
}>();

const free = computed(() => props.size - props.usage);
const percentFree = computed(() => percent(free.value, props.size));
const percentUsed = computed(() => percent(props.usage, props.size));

const isDisplayed = computed(
  () => !isNaN(percentUsed.value) && !isNaN(percentFree.value)
);
</script>
<style lang="postcss" scoped>
.summary {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-blue-scale-300);
}

.summary-card {
  color: var(--color-blue-scale-200);
  display: flex;
  text-transform: uppercase;
}

.summary-card p {
  font-weight: 700;
}

.summary-value {
  display: flex;
  flex-direction: column;
  text-align: right;
}
</style>
