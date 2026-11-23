<template>
  <UiTableCell capped>
    <div :class="{ expanded: isExpanded }" class="vts-tag-cell">
      <UiTagsList v-if="isExpanded" class="tags">
        <VtsTag v-for="tagItem of tags" :key="tagItem" :value="tagItem" :accent />
      </UiTagsList>
      <div v-else ref="container" class="tags">
        <UiTagsList ref="content" nowrap class="list">
          <VtsTag
            v-for="tagItem of visibleTags"
            :key="tagItem"
            :value="tagItem"
            :accent
            :class="{ truncatable: tagItem === truncatableTag }"
            class="tag"
          />
        </UiTagsList>
      </div>
      <UiButton
        v-if="isExpanded || hiddenTags.length > 0"
        v-tooltip="isExpanded ? t('action:show-less') : hiddenTags.join(', ')"
        :aria-label="isExpanded ? t('action:show-less') : undefined"
        :aria-expanded="isExpanded"
        accent="brand"
        size="small"
        variant="tertiary"
        class="typo-body-regular-small more"
        @click="toggleExpand()"
      >
        <VtsIcon v-if="isExpanded" size="small" name="fa:minus" />
        <template v-else>{{ t('plus-n', { n: hiddenTags.length }) }}</template>
      </UiButton>
    </div>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useCollapseOnOverflow } from '@core/composables/collapse-on-overflow.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { MaybeArray } from '@core/types/utility.type.ts'
import { toArray } from '@core/utils/to-array.utils.ts'
import { useToggle } from '@vueuse/shared'
import { computed, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { tag, accent } = defineProps<{
  tag: MaybeArray<string>
  accent: TagAccent
}>()

const { t } = useI18n()

const tags = computed(() => toArray(tag).filter(tagItem => tagItem.trim() !== ''))

const [isExpanded, toggleExpand] = useToggle()

const container = useTemplateRef('container')

const content = useTemplateRef('content')

const { collapsedCount, reset } = useCollapseOnOverflow(container, content, () => Math.max(tags.value.length - 1, 0))

const visibleCount = computed(() => tags.value.length - collapsedCount.value)

const visibleTags = computed(() => tags.value.slice(0, visibleCount.value))

const hiddenTags = computed(() => tags.value.slice(visibleCount.value))

const truncatableTag = computed(() => visibleTags.value.at(-1))

watch(
  () => tags.value.join(),
  () => reset()
)
</script>

<style lang="postcss" scoped>
.vts-tag-cell {
  display: flex;
  align-items: center;
  gap: 0.4rem;

  &.expanded {
    align-items: flex-start;
  }

  .tags {
    overflow: hidden;
  }

  .list {
    align-items: center;
    width: max-content;
    max-width: 100%;
  }

  .tag {
    flex-shrink: 0;

    &.truncatable {
      flex: 1 0 8rem;
      max-width: max-content;
    }
  }

  .more {
    margin-inline-start: auto;
  }
}
</style>
