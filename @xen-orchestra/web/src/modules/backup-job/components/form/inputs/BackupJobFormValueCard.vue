<template>
  <div class="backup-job-form-value-card">
    <div :class="{ error: errorMessages.length > 0 }" class="card">
      <span class="header typo-body-bold">{{ label }}</span>
      <div class="values" :style="{ gridTemplateColumns: `repeat(${columns}, 1fr)` }">
        <ScheduleCronValueButton
          v-for="option of options"
          :key="option.value"
          :selected="model.includes(option.value)"
          @toggle="toggle(option.value)"
        >
          {{ option.label }}
        </ScheduleCronValueButton>
      </div>
    </div>
    <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>
      {{ message }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import ScheduleCronValueButton from '@/modules/schedule/components/ScheduleCronValueButton.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  options: { label: string; value: number }[]
  columns: number
  error?: InputWrapperMessage
}>()

const model = defineModel<number[]>({ required: true })

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
)

function toggle(value: number) {
  model.value = model.value.includes(value)
    ? model.value.filter(selected => selected !== value)
    : [...model.value, value].sort((a, b) => a - b)
}
</script>

<style lang="postcss" scoped>
.backup-job-form-value-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .card {
    display: flex;
    flex-direction: column;
    flex: 1;
    border: 0.1rem solid var(--color-neutral-border);
    overflow: hidden;
    border-radius: 0.8rem;
    background-color: var(--color-neutral-background-primary);

    &.error {
      border-color: var(--color-danger-item-base);
    }
  }

  .header {
    padding: 1.6rem;
  }

  .values {
    display: grid;
    align-content: center;
    gap: 0.4rem;
    flex: 1;
    padding: 1.6rem;
    background-color: var(--color-neutral-background-secondary);
  }
}
</style>
