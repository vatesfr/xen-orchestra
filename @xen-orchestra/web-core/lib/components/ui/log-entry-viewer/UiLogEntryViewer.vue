<!-- v2 -->
<template>
  <div class="ui-log-entry-viewer" :class="className">
    <div class="label-container">
      <div :class="fontClasses.labelClass" class="label">
        {{ label }}
      </div>
      <div class="actions">
        <VtsCopyButton :value="codeTextValue ?? ''" />
        <UiButtonIcon :icon="faArrowUpRightFromSquare" size="medium" accent="brand" @click="openRawValueInNewTab()" />
      </div>
    </div>
    <code ref="code-element" :class="fontClasses.codeClass" class="code-container">
      <slot />
    </code>
  </div>
</template>

<script setup lang="ts">
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { computed, useTemplateRef } from 'vue'

type QuoteCodeAccent = 'info' | 'warning' | 'danger'
type QuoteCodeSize = 'small' | 'medium'

const { size, accent } = defineProps<{
  label: string
  size: QuoteCodeSize
  accent: QuoteCodeAccent
}>()

defineSlots<{
  default(): any
}>()

const mapping = {
  small: {
    labelClass: 'typo-body-regular-small',
    codeClass: 'typo-form-value-small',
  },
  medium: {
    labelClass: 'typo-body-regular',
    codeClass: 'typo-form-value',
  },
}

const fontClasses = useMapper(() => size, mapping, 'medium')

const className = computed(() =>
  toVariants({
    accent,
  })
)

const codeElement = useTemplateRef('code-element')
const codeTextValue = computed(() => codeElement.value?.textContent)

function openRawValueInNewTab() {
  const rawValue =
    typeof codeTextValue.value === 'object' ? JSON.stringify(codeTextValue.value, null, 2) : codeTextValue.value

  const newTab = window.open('', '_blank')

  if (newTab) {
    const pre = newTab.document.createElement('pre')
    pre.textContent = rawValue ?? null
    newTab.document.body.appendChild(pre)
  }
}
</script>

<style lang="postcss" scoped>
.ui-log-entry-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .actions {
      display: flex;
      gap: 0.8rem;
      align-items: center;
    }
  }

  .code-container {
    background-color: var(--color-neutral-background-disabled);
    padding: 0.8rem 1.2rem;
    border-radius: 0.4rem;
    border-inline-start: 0.2rem solid;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 18rem;
    overflow: auto;
  }

  &.accent--info {
    .code-container {
      border-inline-start-color: var(--color-info-item-base);
    }
  }

  &.accent--warning {
    .code-container {
      border-inline-start-color: var(--color-warning-item-base);
    }
  }

  &.accent--danger {
    .code-container {
      border-inline-start-color: var(--color-danger-item-base);
    }
  }
}
</style>
