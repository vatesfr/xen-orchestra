<!-- v1 -->
<template>
  <ol class="ui-numbered-stepper">
    <li
      v-for="step in stepItems"
      :key="step.number"
      class="step"
      :class="{ done: step.isDone, current: step.isCurrent }"
      :aria-current="step.isCurrent ? 'step' : undefined"
    >
      <span class="marker typo-caption-small" aria-hidden="true">
        <VtsIcon v-if="step.isDone" name="fa:check" size="small" />
        <template v-else>{{ step.number }}</template>
      </span>
      <span class="label" :class="step.isCurrent ? 'typo-body-bold-small' : 'typo-body-regular-small'">
        {{ step.label }}
        <span v-if="step.isDone" class="visually-hidden">{{ t('done') }}</span>
      </span>
    </li>
  </ol>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type NumberedStepDefinition = {
  label: string
}

const { steps, currentStep } = defineProps<{
  steps: NumberedStepDefinition[]
  currentStep: number
}>()

const { t } = useI18n()

const stepItems = computed(() =>
  steps.map((step, index) => ({
    label: step.label,
    number: index + 1,
    isDone: index < currentStep,
    isCurrent: index === currentStep,
  }))
)
</script>

<style lang="postcss" scoped>
.ui-numbered-stepper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;

  .step {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    &:not(:last-child)::after {
      content: '';
      width: 4rem;
      height: 0.2rem;
      margin-inline: 0.4rem;
      background-color: var(--color-neutral-border);
    }

    &:is(.done, .current) .label {
      color: var(--color-neutral-txt-primary);
    }
  }

  .marker {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 50%;
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-primary);
  }

  .label {
    color: var(--color-neutral-txt-secondary);
  }

  .done .marker {
    border-color: var(--color-success-item-base);
    color: var(--color-success-txt-base);
    background-color: var(--color-success-background-selected);
  }

  .current .marker {
    border-color: var(--color-brand-item-base);
    color: var(--color-brand-txt-item);
    background-color: var(--color-brand-item-base);
  }
}
</style>
