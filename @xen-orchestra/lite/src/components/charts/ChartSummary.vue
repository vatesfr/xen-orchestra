<template>
  <div class="chart-summary">
    <div>
      <div>TOTAL USED</div>
      <div>
        {{ usedPercent }}%
        <br />
        {{ valueFormatter(used) }}
      </div>
    </div>
    <div>
      <div>TOTAL FREE</div>
      <div>
        {{ freePercent }}%
        <br />
        {{ valueFormatter(total - used) }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, inject } from "vue";
import { percent } from "@/libs/utils";

const props = defineProps<{
  total: number;
  used: number;
}>();

const usedPercent = computed(() => percent(props.used, props.total));

const freePercent = computed(() =>
  percent(props.total - props.used, props.total)
);

const valueFormatter = inject("valueFormatter") as (value: number) => string;
</script>

<style lang="postcss" scoped>
.chart-summary {
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  margin-top: 2rem;
  color: var(--color-blue-scale-200);
  gap: 4rem;

  & > div {
    display: flex;
    flex: 1;
    justify-content: space-between;
  }
}
</style>
