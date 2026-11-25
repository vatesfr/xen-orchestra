<!-- v5 -->
<template>
  <span :class="className" class="ui-tag typo-body-regular-small">
    <slot />
    <button v-if="removable" :aria-label="t('action:remove')" class="remove" type="button" @click.stop="emit('remove')">
      <VtsIcon name="action:close-cancel-clear" size="medium" />
    </button>
  </span>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export type TagAccent = 'brand' | 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'
type TagVariant = 'primary' | 'secondary'

const { accent, variant } = defineProps<{
  accent: TagAccent
  variant: TagVariant
  removable?: boolean
}>()

const emit = defineEmits<{
  remove: []
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const className = computed(() => toVariants({ accent, variant }))
</script>

<style lang="postcss" scoped>
.ui-tag {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.8rem;
  white-space: normal;
  word-break: break-word;
  padding: 0.35rem 0.8rem;
  vertical-align: middle;
  border-radius: 0.4rem;

  .remove {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: stretch;
    padding: 0 0.4rem;
    margin: -0.35rem -0.8rem -0.35rem -0.4rem;
    border: none;
    border-radius: 0 0.4rem 0.4rem 0;
    color: inherit;
    background-color: transparent;
    cursor: pointer;
  }

  .remove:focus-visible {
    outline: none;

    &::before {
      content: '';
      position: absolute;
      inset: -0.4rem;
      border: 0.2rem solid var(--color-brand-txt-base);
      border-radius: 0.4rem;
    }
  }

  /* COLOR VARIANTS */

  &.accent--brand {
    &.variant--primary {
      background-color: var(--color-brand-item-base);
      color: var(--color-brand-txt-item);

      .remove:hover {
        background-color: var(--color-brand-item-hover);
      }

      .remove:active {
        background-color: var(--color-brand-item-active);
      }
    }

    &.variant--secondary {
      background-color: var(--color-brand-background-selected);
      color: var(--color-brand-txt-base);

      .remove:hover {
        background-color: var(--color-brand-background-hover);
      }

      .remove:active {
        background-color: var(--color-brand-background-active);
      }
    }
  }

  &.accent--info {
    &.variant--primary {
      background-color: var(--color-info-item-base);
      color: var(--color-info-txt-item);

      .remove:hover {
        background-color: var(--color-info-item-hover);
      }

      .remove:active {
        background-color: var(--color-info-item-active);
      }
    }

    &.variant--secondary {
      background-color: var(--color-info-background-selected);
      color: var(--color-info-txt-base);

      .remove:hover {
        background-color: var(--color-info-background-hover);
      }

      .remove:active {
        background-color: var(--color-info-background-active);
      }
    }
  }

  &.accent--neutral {
    &.variant--primary {
      background-color: var(--color-neutral-txt-primary);
      color: var(--color-neutral-background-primary);
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-primary);
    }
  }

  &.accent--success {
    &.variant--primary {
      background-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);

      .remove:hover {
        background-color: var(--color-success-item-hover);
      }

      .remove:active {
        background-color: var(--color-success-item-active);
      }
    }

    &.variant--secondary {
      background-color: var(--color-success-background-selected);
      color: var(--color-success-txt-base);

      .remove:hover {
        background-color: var(--color-success-background-hover);
      }

      .remove:active {
        background-color: var(--color-success-background-active);
      }
    }
  }

  &.accent--warning {
    &.variant--primary {
      background-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);

      .remove:hover {
        background-color: var(--color-warning-item-hover);
      }

      .remove:active {
        background-color: var(--color-warning-item-active);
      }
    }

    &.variant--secondary {
      background-color: var(--color-warning-background-selected);
      color: var(--color-warning-txt-base);

      .remove:hover {
        background-color: var(--color-warning-background-hover);
      }

      .remove:active {
        background-color: var(--color-warning-background-active);
      }
    }
  }

  &.accent--danger {
    &.variant--primary {
      background-color: var(--color-danger-item-base);
      color: var(--color-danger-txt-item);

      .remove:hover {
        background-color: var(--color-danger-item-hover);
      }

      .remove:active {
        background-color: var(--color-danger-item-active);
      }
    }

    &.variant--secondary {
      background-color: var(--color-danger-background-selected);
      color: var(--color-danger-txt-base);

      .remove:hover {
        background-color: var(--color-danger-background-hover);
      }

      .remove:active {
        background-color: var(--color-danger-background-active);
      }
    }
  }

  &.accent--muted {
    &.variant--primary {
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }

    &.variant--secondary {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
