<!-- v2 -->
<template>
  <label class="ui-toggle" v-bind="wrapperAttrs">
    <span class="typo c2-semi-bold">
      <slot />
    </span>
    <input v-model="toggleModel" :disabled="isDisabled || busy" type="checkbox" class="input" v-bind="attrs" />
    <span class="fake-checkbox" :class="{ busy }">
      <VtsIcon :busy accent="success" :icon="faCircle" class="icon" />
    </span>
  </label>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { type HTMLAttributes, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    busy?: boolean
    wrapperAttrs?: HTMLAttributes
  }>(),
  { disabled: undefined }
)

const toggleModel = defineModel<boolean>()

defineSlots<{
  default(): any
}>()

const attrs = useAttrs()

const isDisabled = useContext(DisabledContext, () => props.disabled)
</script>

<style lang="postcss" scoped>
.ui-toggle {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .fake-checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    width: 4rem;
    background-color: var(--color-neutral-background-primary);
    transition:
      background-color 0.125s ease-in-out,
      border-color 0.125s ease-in-out;
    border: 0.1rem solid var(--color-neutral-txt-secondary);
    border-radius: 9rem;

    .icon {
      font-size: 1.7rem;
      position: absolute;
      color: var(--color-neutral-background-primary);
      border: 0.1rem solid var(--color-neutral-txt-secondary);
      border-radius: 9rem;
      transition: transform 0.125s ease-in-out;
      transform: translateX(-1.02rem);
    }
  }

  .input {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;

    &:focus-visible + .fake-checkbox {
      outline: none;

      &::before {
        content: '';
        position: absolute;
        inset: -0.5rem;
        border: 0.2rem solid var(--color-normal-txt-base);
        border-radius: 0.4rem;
      }
    }

    &:checked + .fake-checkbox > .icon {
      transform: translateX(1.02rem);
    }

    &:checked + .fake-checkbox {
      border-color: var(--color-neutral-txt-secondary);
      background-color: var(--color-success-item-base);
    }

    &:disabled {
      & + .fake-checkbox {
        border-color: var(--color-neutral-border);
        background-color: var(--color-neutral-background-disabled);
        cursor: not-allowed;

        .icon {
          border-color: var(--color-neutral-border);
          color: var(--color-neutral-background-primary);
        }

        &.busy {
          border-color: var(--color-neutral-border);
          background-color: var(--color-neutral-background-disabled);

          .icon {
            color: var(--color-normal-item-base);
            border: 0.1rem solid var(--color-neutral-border);
            background-color: var(--color-neutral-background-primary);
            font-size: 1.4rem;
            transform: translateX(-1.05rem);
          }
        }
      }

      &:checked + .fake-checkbox {
        background-color: var(--color-success-item-disabled);

        &.busy {
          border-color: var(--color-neutral-border);
          background-color: var(--color-success-item-disabled);

          .icon {
            transform: translateX(1.05rem);
          }
        }
      }
    }
  }
}
</style>
