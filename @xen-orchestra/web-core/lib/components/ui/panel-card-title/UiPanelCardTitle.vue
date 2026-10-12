<!-- v3 -->
<template>
  <div class="ui-panel-card-title">
    <div class="header">
      <div class="title" :class="typoClasses[size]">
        <UiLink v-if="isLink" :size :icon :to :href :target :disabled>
          <slot name="label">{{ label }}</slot>
        </UiLink>
        <template v-else>
          <VtsIcon v-if="icon !== undefined" :name="icon" size="medium" class="icon" />
          <slot name="label">{{ label }}</slot>
        </template>
        <UiCounter
          v-if="counterProps !== undefined"
          v-bind="counterProps"
          size="small"
          variant="primary"
          class="counter"
        />
      </div>
      <div v-if="slots.action" class="action">
        <slot name="action" />
      </div>
      <div v-if="slots['more-actions']" class="more-actions">
        <slot name="more-actions" />
      </div>
    </div>
    <VtsCodeSnippet v-if="id !== undefined" class="id" :content="id" copy />
  </div>
</template>

<script lang="ts" setup>
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCounter, { type CounterAccent, type CounterValue } from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import { computed } from 'vue'

type PanelCardTitleSize = 'small' | 'medium'

const { label, size, icon, id, counter, to, href, target, disabled } = defineProps<
  LinkOptions & {
    size: PanelCardTitleSize
    label?: string
    icon?: IconName
    id?: string
    counter?: CounterValue | { value: CounterValue; accent: CounterAccent }
  }
>()

const slots = defineSlots<{
  label?(): any
  action?(): any
  'more-actions'?(): any
}>()

const typoClasses = {
  small: 'typo-body-bold-small',
  medium: 'typo-body-bold',
}

const isLink = computed(() => to !== undefined || href !== undefined)

const counterProps = computed(() => {
  if (counter === undefined) {
    return undefined
  }

  if (typeof counter === 'object') {
    return counter
  }

  return { value: counter, accent: 'neutral' } as const
})
</script>

<style scoped lang="postcss">
.ui-panel-card-title {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.4rem;
  color: var(--color-neutral-txt-primary);

  .header {
    display: flex;
    align-items: center;
    gap: 1.6rem;
    width: 100%;
  }

  .title {
    overflow-wrap: anywhere;

    .icon {
      margin-inline-end: 0.8rem;
    }

    .counter {
      margin-inline-start: 0.8rem;
    }
  }

  .action,
  .more-actions {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .more-actions {
    margin-inline-start: auto;
  }

  .id {
    width: 100%;
  }
}
</style>
