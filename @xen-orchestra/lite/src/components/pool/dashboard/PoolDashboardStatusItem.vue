<template>
  <div class="pool-dashboard-status-item">
    <ProgressCircle :max-value="total" :value="active" />
    <div class="content">
      <UiTitle type="h5">{{ label }}</UiTitle>
      <div class="status-line">
        <div class="bullet" />
        <div class="label">Active</div>
        <div class="count">{{ active }}</div>
      </div>
      <div class="status-line">
        <div class="bullet inactive" />
        <div class="label">Inactive</div>
        <div class="count">{{ inactive }}</div>
      </div>
      <div class="total">
        Total <span>{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import ProgressCircle from "@/components/ProgressCircle.vue";
import UiTitle from "@/components/ui/UiTitle.vue";

const props = defineProps<{
  label: string;
  active: number;
  total: number;
}>();

const inactive = computed(() => props.total - props.active);
</script>

<style lang="postcss" scoped>
.pool-dashboard-status-item {
  display: flex;
  gap: 3.4rem;
}

.progress-circle {
  width: 6.4rem;
}

.content {
  flex: 1;
}

.bullet {
  width: 1.3rem;
  height: 1.3rem;
  border-radius: 0.65rem;
  background-color: var(--color-green-infra-base);

  &.inactive {
    background-color: var(--color-blue-scale-400);
  }
}

.status-line {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  font-weight: 400;
  font-size: 1.6rem;
  align-items: center;
}

.label {
  margin-right: auto;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
  font-weight: 600;
  text-transform: uppercase;
}
</style>
