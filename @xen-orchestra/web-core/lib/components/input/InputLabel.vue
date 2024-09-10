<!-- v2.0 -->
<template>
  <div :class="status" class="input-label">
    <UiIcon :icon class="left-icon" />
    <span :class="{ required }" class="typo c2-semi-bold label"><slot /></span>
    <a v-if="href" :href class="link">
      <span class="typo p3-regular-underline">{{ $t('learn-more') }}</span>
      <UiIcon :icon="faUpRightFromSquare" class="link-icon" />
    </a>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@core/components/icon/UiIcon.vue'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  status: 'normal' | 'warning' | 'danger'
  icon?: IconDefinition
  required?: boolean
  href?: string
}>()
</script>

<style lang="postcss" scoped>
/* COLOR VARIANTS */

.input-label {
  &.normal {
    --label__color: var(--color-neutral-txt-primary);
  }

  &.warning {
    --label__color: var(--color-warning-txt-base);
  }

  &.danger {
    --label__color: var(--color-danger-txt-base);
  }
}

/* IMPLEMENTATION */

.input-label {
  display: flex;
  align-items: center;
}

.left-icon {
  margin-right: 0.8rem;
}

.label {
  color: var(--label__color);

  &.required::after {
    content: '*';
    margin-left: 0.4rem;
    color: var(--color-normal-txt-base);
  }
}

.link {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-left: auto;
}

.link-icon {
  font-size: 0.8rem;
}
</style>
