<!-- v2 -->
<template>
  <div class="ui-log-entry-viewer" :class="className">
    <div class="label-container">
      <div :class="fontClasses.labelClass" class="label">
        {{ label }}
      </div>
      <div class="actions">
        <VtsCopyButton :value="content" />
        <UiButtonIcon
          icon="fa:arrow-up-right-from-square"
          size="small"
          accent="brand"
          @click="openRawValueInNewTab()"
        />
      </div>
    </div>
    <code :class="fontClasses.codeClass" class="code-container">
      {{ content }}
    </code>
  </div>
</template>

<script setup lang="ts">
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed, watch } from 'vue'

type LogEntryViewerAccent = 'info' | 'warning' | 'danger'
type LogEntryViewerSize = 'small' | 'medium'

const {
  size,
  accent,
  content: rawContent = '',
} = defineProps<{
  label: string
  content: string | object | undefined
  size: LogEntryViewerSize
  accent: LogEntryViewerAccent
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

const content = computed(() => {
  if (typeof rawContent === 'object') {
    return JSON.stringify(rawContent, null, 2)
  }

  return rawContent
})

const pre = document.createElement('pre')

watch(
  () => content,
  content => {
    pre.textContent = content.value
  },
  { immediate: true }
)

function openRawValueInNewTab() {
  window.open('', '_blank')?.document.body.appendChild(pre)
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
