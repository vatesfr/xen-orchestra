<template>
  <div class="ui-accordion-item" :class="classNames">
    <div class="header" @click="toggle">
      <span class="header-title" :class="font">
        {{ title }}
      </span>
      <VtsIcon :name="isExpanded ? 'fa:angle-up' : 'fa:angle-down'" size="large" />
    </div>
    <span v-if="isExpanded" class="content">
      <VtsDivider type="stretch" />
      <slot name="content">
        {{ content }}
      </slot>
    </span>
  </div>
</template>

<script setup lang="ts">
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { useMapper } from '@core/packages/mapper'
import { IK_ACCORDION } from '@core/utils/injection-keys.util'
import { toVariants } from '@core/utils/to-variants.util'
import { computed, inject, ref } from 'vue'

const { size, title, disabled, identifier } = defineProps<{
  size: 'small' | 'large'
  title: string
  identifier: string | number
  content?: string
  disabled?: boolean
}>()

defineSlots<{
  content?(): any
}>()

const accordion = inject(IK_ACCORDION)

const localExpanded = ref(false)

const isExpanded = computed(() => {
  if (accordion) {
    return accordion.expandedKey === String(identifier)
  }
  return localExpanded.value
})

const toggle = () => {
  if (disabled === true) return

  if (accordion) {
    accordion.toggle(String(identifier))
  } else {
    localExpanded.value = !localExpanded.value
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
      expand: isExpanded.value,
    }),
  ]
})
</script>

<style scoped lang="postcss">
.ui-accordion-item {
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: space-between;
    color: var(--color-brand-txt-base);
    cursor: pointer;
  }

  .content {
    display: flex;
    flex-direction: column;
  }

  /* HEADER VARIANT */
  &.muted .header {
    color: var(--color-neutral-txt-secondary);
  }

  &:not(.muted) {
    .header:hover {
      color: var(--color-brand-txt-hover);
    }

    .header:active {
      color: var(--color-brand-txt-active);
    }
  }

  /* SIZE VARIANT */
  &.size--small {
    &:not(.expand) {
      border-bottom: 0.1rem solid var(--color-neutral-border);
    }

    .header {
      padding-bottom: 0.4rem;
    }

    .content {
      gap: 0.4rem;
    }
  }

  &.size--large {
    border: 0.1rem solid var(--color-neutral-border);
    border-radius: 0.4rem;

    .header {
      padding: 1.6rem;
      padding-bottom: 1.2rem;
    }

    .content {
      gap: 1.2rem;
      margin: 0 1.2rem 1.2rem 1.2rem;
    }
  }
}
</style>
