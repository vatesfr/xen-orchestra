<template>
  <UiTableCell>
    <UiTagsList>
      <template v-for="parsedTag of parsedTags" :key="parsedTag.raw">
        <span
          v-if="parsedTag.isScoped"
          :class="`accent--${parsedTag.accent}`"
          class="vts-tag-cell-scoped typo-body-regular-small"
        >
          <span class="key">{{ parsedTag.key }}</span>
          <span class="value">{{ parsedTag.value }}</span>
        </span>
        <UiTag v-else :accent="parsedTag.accent" variant="secondary">
          {{ parsedTag.raw }}
        </UiTag>
      </template>
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

type TagAccent = 'info' | 'neutral' | 'success' | 'warning' | 'danger' | 'muted'

interface ParsedTag {
  raw: string
  isScoped: boolean
  key: string
  value: string
  accent: TagAccent
}

export interface TagWithAccent {
  label: string
  accent?: TagAccent
}

const { tag } = defineProps<{
  tag: MaybeArray<string | TagWithAccent>
}>()

function getTagLabel(tagItem: string | TagWithAccent): string {
  if (typeof tagItem === 'string') {
    return tagItem
  }

  return tagItem?.label ?? ''
}

function getTagAccent(tagItem: string | TagWithAccent): TagAccent {
  if (typeof tagItem === 'object' && tagItem?.accent !== undefined) {
    return tagItem.accent
  }

  return 'info'
}

const parsedTags = computed<ParsedTag[]>(() =>
  toArray(tag)
    .filter(tagItem => getTagLabel(tagItem).trim() !== '')
    .map(tagItem => {
      const label = getTagLabel(tagItem)
      const accent = getTagAccent(tagItem)
      const separatorIndex = label.indexOf('=')

      if (separatorIndex === -1) {
        return { raw: label, isScoped: false, key: '', value: '', accent }
      }

      return {
        raw: label,
        isScoped: true,
        key: label.slice(0, separatorIndex),
        value: label.slice(separatorIndex + 1),
        accent,
      }
    })
)
</script>

<style lang="postcss" scoped>
.vts-tag-cell-scoped {
  display: inline-flex;
  align-items: center;
  border-radius: 0.4rem;
  overflow: hidden;
  vertical-align: middle;
  height: 2.4rem;

  &.accent--info {
    .key {
      background-color: var(--color-info-item-base);
      color: var(--color-info-txt-item);
    }

    .value {
      background-color: var(--color-info-background-selected);
      color: var(--color-info-txt-base);
    }
  }

  &.accent--success {
    .key {
      background-color: var(--color-success-item-base);
      color: var(--color-success-txt-item);
    }

    .value {
      background-color: var(--color-success-background-selected);
      color: var(--color-success-txt-base);
    }
  }

  &.accent--danger {
    .key {
      background-color: var(--color-danger-item-base);
      color: var(--color-danger-txt-item);
    }

    .value {
      background-color: var(--color-danger-background-selected);
      color: var(--color-danger-txt-base);
    }
  }

  &.accent--warning {
    .key {
      background-color: var(--color-warning-item-base);
      color: var(--color-warning-txt-item);
    }

    .value {
      background-color: var(--color-warning-background-selected);
      color: var(--color-warning-txt-base);
    }
  }

  &.accent--neutral {
    .key {
      background-color: var(--color-neutral-txt-primary);
      color: var(--color-neutral-background-primary);
    }

    .value {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-primary);
    }
  }

  &.accent--muted {
    .key {
      background-color: var(--color-neutral-background-disabled);
      color: var(--color-neutral-txt-secondary);
    }

    .value {
      background-color: var(--color-neutral-background-secondary);
      color: var(--color-neutral-txt-secondary);
    }
  }

  .key,
  .value {
    padding: 0.2rem 0.6rem;
  }
}
</style>
