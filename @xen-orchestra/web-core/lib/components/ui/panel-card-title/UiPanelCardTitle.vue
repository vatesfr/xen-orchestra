<!-- v3 -->
<template>
  <div class="ui-panel-card-title">
    <div v-if="label !== undefined" class="title" :class="typoClasses[size]">
      <UiLink v-if="isLink" :size :icon :to :href :target :disabled>
        {{ label }}
      </UiLink>
      <template v-else>
        <VtsIcon v-if="icon !== undefined" :name="icon" size="medium" />
        {{ label }}
      </template>
      <UiCounter v-if="counterProps !== undefined" v-bind="counterProps" size="small" variant="primary" />
    </div>
    <VtsCodeSnippet v-if="id !== undefined" class="id" :content="id" copy />
  </div>
</template>

<script lang="ts" setup>
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCounter, { type CounterProps } from '@core/components/ui/counter/UiCounter.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { LinkOptions } from '@core/composables/link-component.composable.ts'
import type { IconName } from '@core/icons'
import { computed } from 'vue'

export type UiPanelCardTitleProps = LinkOptions & {
  size: 'small' | 'medium'
  label?: string
  icon?: IconName
  id?: string
  counter?: CounterProps['value'] | Pick<CounterProps, 'value' | 'accent'>
}

const { label, size, icon, id, counter, to, href, target, disabled } = defineProps<UiPanelCardTitleProps>()

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
  gap: 0.8rem;
  color: var(--color-neutral-txt-primary);

  .title {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .id {
    width: 100%;
  }
}
</style>
