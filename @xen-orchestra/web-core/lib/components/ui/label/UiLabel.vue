<!-- v3 -->
<template>
  <div :class="toVariants({ accent })" class="ui-label">
    <label :for="htmlFor" :class="{ required }" class="typo-body-bold label">
      <slot />
    </label>
    <UiLink v-if="href" size="small" :href>{{ t('learn-more') }}</UiLink>
  </div>
</template>

<script lang="ts" setup>
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toVariants } from '@core/utils/to-variants.util'
import { useI18n } from 'vue-i18n'

export type LabelAccent = 'neutral' | 'warning' | 'danger'

const { for: htmlFor } = defineProps<{
  accent: LabelAccent
  for?: string
  required?: boolean
  href?: string
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.ui-label {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .label {
    &.required::after {
      content: '*';
      margin-left: 0.4rem;
      color: var(--color-info-txt-base);
    }
  }

  /* ACCENT VARIANTS */

  &.accent--neutral {
    .label {
      color: var(--color-neutral-txt-primary);
    }
  }

  &.accent--warning {
    .label {
      color: var(--color-warning-txt-base);
    }
  }

  &.accent--danger {
    .label {
      color: var(--color-danger-txt-base);
    }
  }
}
</style>
