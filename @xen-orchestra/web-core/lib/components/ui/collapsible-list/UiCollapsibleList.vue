<!-- v1 -->
<template>
  <div class="ui-collapsible-list" :class="{ expanded: isExpanded }">
    <component :is="tag" class="container">
      <slot />
    </component>
    <div v-if="hasMoreItems" class="footer">
      <UiButton size="small" accent="brand" variant="tertiary" @click="isExpanded = !isExpanded">
        {{ isExpanded ? t('see-less') : t('see-n-more', { n: remainingItems }) }}
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useStyleTag } from '@vueuse/core'
import { useMax } from '@vueuse/math'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  tag,
  totalItems,
  visibleItems = 5,
} = defineProps<{
  tag: string
  totalItems: number
  visibleItems?: number
}>()

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const remainingItems = useMax(() => totalItems - visibleItems, 0)

const hasMoreItems = computed(() => remainingItems.value > 0)

const isExpanded = ref(false)

const style = computed(
  () => `.ui-collapsible-list:not(.expanded) > .container *:nth-child(n+${visibleItems + 1}) { display: none }`
)

useStyleTag(style)
</script>

<style lang="postcss" scoped>
.ui-collapsible-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: start;

  .container {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    width: 100%;

    :deep(li) {
      line-height: 1;
    }
  }

  .footer {
    display: flex;
    gap: 1.2rem;
    align-items: center;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
