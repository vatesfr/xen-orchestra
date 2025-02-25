<template>
  <component :is="hasLabel ? 'span' : 'label'" :class="`form-${type}`" v-bind="wrapperAttrs">
    <input
      v-model="value"
      :class="{ indeterminate: isIndeterminate }"
      :disabled="isDisabled"
      :type="type === 'radio' ? 'radio' : 'checkbox'"
      class="input"
      v-bind="attrs"
    />
    <span class="fake-checkbox">
      <UiIcon :fixed-width="false" :icon class="icon" />
    </span>
  </component>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { IK_CHECKBOX_TYPE, IK_FORM_HAS_LABEL } from '@/types/injection-keys'
import { useDisabled } from '@core/composables/disabled.composable'
import { faCheck, faCircle, faMinus } from '@fortawesome/free-solid-svg-icons'
import { useVModel } from '@vueuse/core'
import { computed, type HTMLAttributes, inject, useAttrs } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: unknown
  disabled?: boolean
  wrapperAttrs?: HTMLAttributes
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const attrs = useAttrs()

const value = useVModel(props, 'modelValue', emit)
const type = inject(IK_CHECKBOX_TYPE, 'checkbox')
const hasLabel = inject(
  IK_FORM_HAS_LABEL,
  computed(() => false)
)
const isDisabled = useDisabled(() => props.disabled)
const icon = computed(() => {
  if (type !== 'checkbox') {
    return faCircle
  }

  if (value.value === undefined) {
    return faMinus
  }

  return faCheck
})

const isIndeterminate = computed(() => (type === 'checkbox' || type === 'toggle') && value.value === undefined)
</script>

<style lang="postcss" scoped>
.form-toggle,
.form-checkbox,
.form-radio {
  display: inline-flex;
  height: 1.25em;

  --checkbox-border-width: 0.0625em;
}

.form-radio {
  --checkbox-border-radius: 0.625em;
  --checkbox-icon-size: 0.625em;
}

.form-checkbox {
  --checkbox-border-radius: 0.25em;
  --checkbox-icon-size: 1em;

  .input.indeterminate + .fake-checkbox > .icon {
    opacity: 1;
    color: var(--color-brand-txt-item);
  }
}

.form-checkbox,
.form-radio {
  width: 1.25em;

  .fake-checkbox {
    width: 1.25em;
    --background-color: var(--color-neutral-background-primary);
  }

  .icon {
    transition: opacity 0.125s ease-in-out;
  }

  .input + .fake-checkbox > .icon {
    opacity: 0;
  }

  .input:checked + .fake-checkbox > .icon {
    opacity: 1;
  }
}

.form-toggle {
  width: 2.5em;
  --checkbox-border-radius: 0.625em;
  --checkbox-icon-size: 0.875em;

  .fake-checkbox {
    width: 2.5em;
    --background-color: var(--color-neutral-border);
  }

  .icon {
    transition: transform 0.125s ease-in-out;
    transform: translateX(-0.7em);
  }

  .input:checked + .fake-checkbox > .icon {
    transform: translateX(0.7em);
  }

  .input.indeterminate + .fake-checkbox > .icon {
    opacity: 1;
    color: var(--color-neutral-txt-secondary);
    transform: translateX(0);
  }
}

.input {
  font-size: inherit;
  position: absolute;
  pointer-events: none;
  opacity: 0;
}

.icon {
  font-size: var(--checkbox-icon-size);
  position: absolute;
  color: var(--color-brand-txt-item);

  filter: drop-shadow(0 0.0625em 0.5em rgba(0, 0, 0, 0.1)) drop-shadow(0 0.1875em 0.1875em rgba(0, 0, 0, 0.06))
    drop-shadow(0 0.1875em 0.25em rgba(0, 0, 0, 0.08));
}

.fake-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.25em;
  transition:
    background-color 0.125s ease-in-out,
    border-color 0.125s ease-in-out;
  border: var(--checkbox-border-width) solid var(--border-color);
  border-radius: var(--checkbox-border-radius);
  background-color: var(--background-color);
  box-shadow: var(--shadow-100);

  --border-color: var(--color-brand-item-base);
}

.input:disabled {
  & + .fake-checkbox {
    cursor: not-allowed;
    --border-color: var(--color-neutral-txt-secondary);
  }

  &:checked + .fake-checkbox {
    --border-color: transparent;
    --background-color: var(--color-brand-item-disabled);
  }
}

.input:not(:disabled) {
  &:hover + .fake-checkbox,
  &:focus + .fake-checkbox {
    --border-color: var(--color-brand-item-hover);
  }

  &:active + .fake-checkbox {
    --border-color: var(--color-brand-item-active);
  }

  &:checked + .fake-checkbox {
    --border-color: transparent;
    --background-color: var(--color-brand-item-base);
  }

  &:checked:hover + .fake-checkbox,
  &:checked:focus + .fake-checkbox {
    --background-color: var(--color-brand-item-hover);
  }

  &:checked:active + .fake-checkbox {
    --background-color: var(--color-brand-item-active);
  }
}
</style>
