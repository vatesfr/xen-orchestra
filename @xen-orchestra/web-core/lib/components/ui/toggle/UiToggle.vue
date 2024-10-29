<!-- v2 -->
<template>
  <div class="ui-toggle-wrapper">
    <div class="typo c4-semi-bold">
      <slot />
    </div>
    <label class="form-toggle" v-bind="wrapperAttrs">
      <input v-model="value" :disabled="isDisabled" type="checkbox" class="ui-toggle" v-bind="attrs" />
      <span class="fake-checkbox">
        <VtsIcon :busy="busy" accent="success" :fixed-width="false" :icon class="icon" />
      </span>
    </label>
  </div>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { DisabledContext } from '@core/context'
import { faCircle } from '@fortawesome/free-solid-svg-icons'
import { computed, type HTMLAttributes, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    busy?: boolean
    wrapperAttrs?: HTMLAttributes
  }>(),
  { disabled: undefined }
)

const value = defineModel<boolean>('modelValue')

defineSlots<{
  default(): any
}>()

const attrs = useAttrs()

const isDisabled = useContext(DisabledContext, () => props.disabled)

const icon = computed(() => {
  return faCircle
})
</script>

<style lang="postcss" scoped>
.ui-toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .form-toggle {
    position: relative;
    display: flex;

    .fake-checkbox {
      width: 4rem;
      background-color: white;
    }

    .icon {
      transition: transform 0.125s ease-in-out;
      transform: translateX(-0.6em);
    }

    .ui-toggle:checked + .fake-checkbox > .icon {
      transform: translateX(0.6em);
    }
  }

  .ui-toggle {
    font-size: inherit;
    position: absolute;
    pointer-events: none;
    opacity: 0;
  }

  .icon {
    font-size: 1.7rem;
    position: absolute;
    color: var(--color-neutral-background-primary);
    border: 0.1rem solid var(--color-neutral-txt-secondary);
    border-radius: 9rem;
  }

  .fake-checkbox {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    transition:
      background-color 0.125s ease-in-out,
      border-color 0.125s ease-in-out;
    border: 0.1rem solid var(--color-neutral-txt-secondary);
    border-radius: 9rem;
    box-shadow: var(--shadow-100);
  }

  .ui-toggle:disabled {
    & + .fake-checkbox {
      border-color: var(--color-neutral-border);
      background-color: var(--color-neutral-background-disabled);

      .icon {
        border-color: var(--color-neutral-border);
        color: var(--color-neutral-background-primary);
      }
    }

    &:checked + .fake-checkbox {
      background-color: var(--color-success-item-disabled);
    }
  }

  .ui-toggle:not(:disabled) {
    &:checked + .fake-checkbox {
      border-color: var(--color-neutral-txt-secondary);
      background-color: var(--color-success-item-base);
    }
  }
}
</style>
