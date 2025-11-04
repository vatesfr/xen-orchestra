<!-- v2 -->
<template>
  <nav class="ui-breadcrumb" :class="className" :aria-label="t('aria.breadcrumb.label')">
    <ol>
      <li v-for="child in slots.default()" :key="child.ctx.uid">
        <component :is="child" />
      </li>
    </ol>
  </nav>
</template>

<script lang="ts" setup>
import { useMapper } from '@core/packages/mapper'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { size } = defineProps<{
  size: 'small' | 'medium'
}>()

const slots = defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const fontWeight = useMapper(
  () => size,
  {
    small: 'typo-body-bold-small',
    medium: 'typo-body-bold',
  },
  'medium'
)

const className = computed(() => [toVariants({ size }), fontWeight.value])
</script>

<style lang="postcss" scoped>
.ui-breadcrumb {
  ol {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-wrap: wrap;
  }

  li {
    display: flex;
    align-items: center;
    color: var(--color-neutral-txt-primary);
  }

  li:not(:last-child)::after {
    content: '';
    display: inline-block;
    margin-inline: 0.8rem 0.4rem;
    border-inline-end: 0.2rem solid var(--color-neutral-txt-secondary);
    border-block-start: 0.2rem solid var(--color-neutral-txt-secondary);
    transform: rotate(45deg);
    vertical-align: middle;
  }

  &.size--small {
    li:not(:last-child)::after {
      width: 0.7rem;
      height: 0.7rem;
    }
  }

  &.size--medium {
    li:not(:last-child)::after {
      width: 0.9rem;
      height: 0.9rem;
    }
  }
}
</style>
