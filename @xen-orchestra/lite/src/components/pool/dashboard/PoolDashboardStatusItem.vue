<template>
  <div class="pool-dashboard-status-item">
    <ProgressCircle :max-value="total" :value="active" />
    <div class="content">
      <h6 class="typo-h6">{{ label }}</h6>
      <div class="status-line typo-body-regular">
        <div class="bullet" />
        <div class="label">{{ activeLabel }}</div>
        <div class="count">{{ active }}</div>
      </div>
      <div class="status-line typo-body-regular">
        <div class="bullet inactive" />
        <div class="label">{{ inactiveLabel }}</div>
        <div class="count">{{ inactive }}</div>
      </div>
      <div class="total typo-caption-small">
        {{ $t('total') }} <span>{{ total }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ProgressCircle from '@/components/ProgressCircle.vue'
import { computed } from 'vue'

const props = defineProps<{
  label: string
  active: number
  total: number
  activeLabel: string
  inactiveLabel: string
}>()

const inactive = computed(() => props.total - props.active)
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
  background-color: var(--color-success-item-base);

  &.inactive {
    background-color: var(--color-neutral-background-disabled);
  }
}

.status-line {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  align-items: center;
}

.label {
  margin-right: auto;
}

.total {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}
</style>
