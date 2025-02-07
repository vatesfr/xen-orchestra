<template>
  <div v-if="isDisplayed" class="summary typo-caption-small">
    <div class="summary-card">
      <p>{{ $t('total-used:') }}</p>
      <div class="summary-value">
        <p>{{ $n(percentUsed / 100, 'percent') }}</p>
        <p>
          {{ formatSize(usage) }}
        </p>
      </div>
    </div>
    <div class="summary-card">
      <p>{{ $t('total-free:') }}</p>
      <div class="summary-value">
        <p>{{ $n(percentFree / 100, 'percent') }}</p>
        <p>
          {{ formatSize(free) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { formatSize, percent } from '@/libs/utils'
import { computed } from 'vue'

const props = defineProps<{
  size: number
  usage: number
}>()

const free = computed(() => props.size - props.usage)
const percentFree = computed(() => percent(free.value, props.size))
const percentUsed = computed(() => percent(props.usage, props.size))

const isDisplayed = computed(() => !isNaN(percentUsed.value) && !isNaN(percentFree.value))
</script>

<style lang="postcss" scoped>
.summary {
  display: flex;
  justify-content: space-between;
  color: var(--color-neutral-txt-secondary);
  margin-top: 2rem;
}

.summary-card {
  color: var(--color-neutral-txt-secondary);
  display: flex;
}

.summary-value {
  display: flex;
  flex-direction: column;
  text-align: right;
}
</style>
