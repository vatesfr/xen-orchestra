<template>
  <UiCard>
    <UiTitle type="h4">{{ $t("storage-usage") }}</UiTitle>
    <UsageBar :data="data.result" :nItems="5">
      <template #header>
        <span>{{ $t("storage") }}</span>
        <span>Top 5</span>
      </template>
      <template #footer v-if="showFooter">
        <div class="footer-card">
          <p>{{ $t("total-used") }}:</p>
          <div class="footer-value">
            <p>{{ percentUsed }}%</p>
            <p>
              {{ formatSize(data.usedSize) }}
            </p>
          </div>
        </div>
        <div class="footer-card">
          <p>{{ $t("total-free") }}:</p>
          <div class="footer-value">
            <p>{{ 100 - percentUsed }}%</p>
            <p>
              {{ formatSize(data.maxSize) }}
            </p>
          </div>
        </div>
      </template>
    </UsageBar>
  </UiCard>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import UsageBar from "@/components/UsageBar.vue";
import UiCard from "@/components/ui/UiCard.vue";
import UiTitle from "@/components/ui/UiTitle.vue";
import { formatSize } from "@/libs/utils";
import { useSrStore } from "@/stores/storage.store";

const srStore = useSrStore();

const percentUsed = computed(
  () =>
    Math.round(
      ((data.value.usedSize / data.value.maxSize) * 100 + Number.EPSILON) * 10
    ) / 10
);

const showFooter = computed(() => !isNaN(percentUsed.value));

const data = computed<{
  result: { label: string; value: number }[];
  maxSize: number;
  usedSize: number;
}>(() => {
  const result: { label: string; value: number }[] = [];
  let maxSize = 0;
  let usedSize = 0;

  srStore.allRecords.forEach((sr) => {
    maxSize += sr.physical_size;
    usedSize += sr.physical_utilisation;

    const percent = (sr.physical_utilisation / sr.physical_size) * 100;

    if (isNaN(percent)) {
      return;
    }

    result.push({
      label: sr.name_label,
      value: percent,
    });
  });
  return { result, maxSize, usedSize };
});
</script>

<style lang="postcss" scoped>
.footer-card {
  color: var(--color-blue-scale-200);
  display: flex;
  font-weight: 700;
  text-transform: uppercase;
}

.footer-value {
  display: flex;
  flex-direction: column;
  text-align: right;
}
</style>
