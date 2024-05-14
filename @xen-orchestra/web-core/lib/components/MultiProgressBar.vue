<template>
  <div class="multi-progress-bar">
    <div class="wrapper">
      <div
        v-for="(barSegment, index) in progressBarDataRef"
        :key="index"
        :style="{ width: (barSegment.value / 50) * 100 + '%' }"
        class="segment"
        :class="barSegment.color"
      >
        {{ ((barSegment.value / 50) * 100).toFixed(2) }} %
      </div>
      <div :style="{ width: availableSegmentValue + '%' }" class="segment available"></div>
    </div>
    <div class="legends">
      <span
        v-for="(barSegment, index) in progressBarDataRef"
        :key="index"
        :style="{ width: (barSegment.value / 50) * 100 + '%' }"
        class="legend"
        ><span class="dot" :class="barSegment.color"></span>
        {{ barSegment.legend }}

        <span class="unit">{{ barSegment.value }} GB</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
type progressBarDataType = {
  value: number
  color: string
  legend?: string
}

interface Props {
  progressBarDataProp: progressBarDataType[]
}

const progressBarDataProp = withDefaults(defineProps<Props>(), {
  progressBarDataProp: () => [
    {
      value: 50,
      color: 'available',
      legend: 'Available',
    },
  ],
})

const progressBarDataRef = ref<progressBarDataType[]>(progressBarDataProp.progressBarDataProp)

const totalValue = progressBarDataRef.value.reduce((acc, bar) => acc + bar.value, 0)

const availableSegmentValue = 50 - totalValue

progressBarDataRef.value[progressBarDataRef.value.length - 1].value += availableSegmentValue
</script>

<style scoped lang="postcss">
.multi-progress-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  & .wrapper {
    display: flex;
    height: 40px;
    border-radius: 0.8rem;
    overflow: hidden;
    width: 100%;

    & .segment {
      flex-grow: 1;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1.3rem;
      font-weight: 600;
      color: var(--color-grey-600);
    }
  }

  & .legends {
    display: flex;
    font-size: 1.3rem;
    flex-direction: column;
    align-items: end;
    gap: 0.8rem;

    @media (min-width: 768px) {
      flex-direction: row;
      align-items: center;
      gap: 1.6rem;
    }

    & .legend {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      height: 1.8rem;
      white-space: nowrap;
      max-width: fit-content;
      min-width: fit-content;

      @media (min-width: 768px) {
        flex-grow: 1;
        max-width: inherit;
        max-width: inherit;
      }

      & .dot {
        width: 0.8rem;
        height: 0.8rem;
        min-width: 0.8rem;
        border-radius: 50%;
      }

      & .unit {
        font-weight: 600;
        color: var(--color-grey-300);
        white-space: nowrap;

        @media (min-width: 768px) {
          margin-left: auto;
        }
      }
    }
  }
}

.info {
  background-color: var(--color-purple-base);
}
.success {
  background-color: var(--color-green-base);
}
.warning {
  background-color: var(--color-orange-base);
}
.error {
  background-color: var(--color-red-base);
}
.available {
  background-color: var(--background-color-purple-10);
}
</style>
