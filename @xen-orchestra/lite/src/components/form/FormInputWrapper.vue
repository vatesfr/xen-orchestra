<template>
  <div class="form-input-wrapper">
    <div v-if="label !== undefined || learnMoreUrl !== undefined" class="label-container">
      <label :class="[light ? 'typo-body-regular light' : 'typo-body-bold-small']" :for="id" class="label">
        <UiIcon :icon />
        {{ label }}
      </label>
      <a
        v-if="learnMoreUrl !== undefined"
        :href="learnMoreUrl"
        class="learn-more-url"
        rel="noopener noreferrer"
        target="_blank"
      >
        <UiIcon :icon="faInfoCircle" />
        <span>{{ t('learn-more') }}</span>
      </a>
    </div>
    <div class="input-container">
      <slot />
    </div>
    <div class="messages-container">
      <div v-if="warning !== undefined" class="warning">
        {{ warning }}
      </div>
      <div v-if="error !== undefined" class="error">
        {{ error }}
      </div>
      <div v-if="help !== undefined" class="help">
        {{ help }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiIcon from '@/components/ui/icon/UiIcon.vue'
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { Color } from '@/types'
import { IK_FORM_HAS_LABEL, IK_INPUT_ID } from '@/types/injection-keys'
import { useDisabled } from '@core/composables/disabled.composable'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { uniqueId } from 'lodash-es'
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  label?: string
  id?: string
  icon?: IconDefinition
  learnMoreUrl?: string
  warning?: string
  error?: string
  help?: string
  disabled?: boolean
  light?: boolean
}>()

const { t } = useI18n()

const id = computed(() => props.id ?? uniqueId('form-input-'))
provide(IK_INPUT_ID, id)

const color = computed<Color | undefined>(() => {
  if (props.error !== undefined && props.error.trim() !== '') {
    return 'error'
  }

  if (props.warning !== undefined && props.warning.trim() !== '') {
    return 'warning'
  }

  return undefined
})

provide(
  IK_FORM_HAS_LABEL,
  computed(() => props.label !== undefined)
)

useContext(ColorContext, color)
useDisabled(() => props.disabled)
</script>

<style lang="postcss" scoped>
.form-input-wrapper {
  max-width: 60rem;
}

.label-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.label {
  padding: 1rem 0;

  &.light {
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.light) {
    text-transform: uppercase;
    color: var(--color-neutral-txt-primary);
  }
}

.messages-container {
  margin-top: 1rem;
}

.warning,
.error,
.help,
.learn-more-url {
  font-size: 1.3rem;
  line-height: 150%;
  margin: 0.5rem 0;
}

.learn-more-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: var(--color-brand-txt-base);

  & > span {
    text-decoration: underline;
  }
}

.warning {
  color: var(--color-warning-txt-base);
}

.error {
  color: var(--color-danger-txt-base);
}

.help {
  color: var(--color-neutral-txt-secondary);
}
</style>
