<!-- v1 -->
<template>
  <div :class="toVariants({ accent })" class="ui-label">
    <VtsIcon accent="current" :icon class="icon" />
    <label :for="htmlFor" :class="{ required }" class="typo c2-semi-bold label">
      <slot />
    </label>
    <UiLink v-if="href" class="learn-more-link" size="small" :href>{{ $t('learn-more') }}</UiLink>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { toVariants } from '@core/utils/to-variants.util'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

const { for: htmlFor } = defineProps<{
  accent: 'neutral' | 'warning' | 'danger'
  for?: string
  icon?: IconDefinition
  required?: boolean
  href?: string
}>()
</script>

<style lang="postcss" scoped>
.ui-label {
  display: flex;
  align-items: center;

  .icon {
    margin-right: 0.8rem;
  }

  .label {
    &.required::after {
      content: '*';
      margin-left: 0.4rem;
      color: var(--color-info-txt-base);
    }
  }

  .learn-more-link {
    margin-left: auto;
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
