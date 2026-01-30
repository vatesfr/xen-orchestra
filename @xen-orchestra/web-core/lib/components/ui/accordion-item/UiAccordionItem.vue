<template>
  <div class="ui-accordion-item" :class="classNames">
    <div class="header">
      <span class="header-title" :class="font">
        <slot name="title">
          {{ title }}
        </slot>
      </span>
      <span class="header-icon">
        <UiButtonIcon
          v-tooltip="isExpanded ? t('action:close') : t('action:open')"
          class="toggle"
          accent="brand"
          :icon="isExpanded ? 'fa:angle-up' : 'fa:angle-down'"
          size="small"
          :disabled
          :target-scale="{ x: 1.5, y: 2 }"
          @click="toggle"
        />
      </span>
    </div>
    <VtsDivider v-if="isExpanded || size == 'small'" type="stretch" />
    <span v-if="isExpanded">
      <slot name="content">
        {{ content }}
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util'
import { computed, inject, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { size, title, disabled } = defineProps<{
  content: string
  size: 'small' | 'large'
  title: string
  disabled?: boolean
  value?: string | number
}>()

defineSlots<{
  title?(): any
  content?(): any
}>()

const accordion = inject(
  'accordion',
  null as null | {
    expandedKey: { value: string }
    toggle: (key: string) => void
  }
)

const localExpanded = ref(false)

const isExpanded = computed(() => {
  if (accordion) {
    return accordion.expandedKey.value === title
  }
  return localExpanded.value
})

const toggle = () => {
  if (accordion) {
    accordion.toggle(title ?? null)
  }
}

const font = useMapper(
  () => size,
  {
    small: 'typo-body-bold-small',
    large: 'typo-body-bold',
  },
  'large'
)

const classNames = computed(() => {
  return [
    toVariants({
      size,
      muted: disabled ?? false,
    }),
  ]
})
const { t } = useI18n()
</script>

<style scoped lang="postcss">
.ui-accordion-item {
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: var(--color-brand-txt-base);
  }

  &:hover .header {
    color: var(--color-brand-txt-hover);
  }

  &:active .header {
    color: var(--color-brand-txt-active);
  }

  &.muted .header {
    color: var(--color-neutral-txt-secondary);
  }

  &.size--small {
    gap: 0.4rem;
  }

  &.size--large {
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;
    gap: 1.2rem;
    padding: 1.6rem;
  }
}
</style>
