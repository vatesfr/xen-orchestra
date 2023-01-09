<template>
  <div class="footer">
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
          {{ formatSize(size) }}
        </p>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { formatSize } from "@/libs/utils";
defineProps<{
  percentFree: number;
  percentUsed: number;
  size: number;
  usage: number;
}>();
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
