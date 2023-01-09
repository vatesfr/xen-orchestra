<template>
  <div class="footer" v-if="showFooter">
    <div class="footer-card">
      <p>{{ $t("total-used") }}:</p>
      <div class="footer-value">
        <p>{{ percentUsed }}%</p>
        <p>
          {{ formatSize(usage) }}
        </p>
      </div>
    </div>
    <div class="footer-card">
      <p>{{ $t("total-free") }}:</p>
      <div class="footer-value">
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

const showFooter = computed(
  () => !isNaN(percentUsed.value) && !isNaN(percentFree.value)
);
</script>
<style lang="postcss" scoped>
.footer {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-blue-scale-300);
}

.footer-card {
  color: var(--color-blue-scale-200);
  display: flex;
  text-transform: uppercase;
}

.footer-card p {
  font-weight: 700;
}

.footer-value {
  display: flex;
  flex-direction: column;
  text-align: right;
}
</style>
