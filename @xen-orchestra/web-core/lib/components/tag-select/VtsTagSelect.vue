<template>
  <div ref="rootRef" class="vts-tag-select">
    <UiButtonIcon
      v-if="iconOnly"
      ref="trigger"
      v-tooltip="triggerLabel"
      :aria-label="triggerLabel"
      :icon="triggerIcon"
      accent="brand"
      size="small"
    />
    <UiButton v-else ref="trigger" :left-icon="triggerIcon" accent="brand" size="small" variant="tertiary">
      {{ triggerLabel }}
    </UiButton>

    <template v-if="isOpen">
      <VtsBackdrop />

      <UiDropdownList ref="dropdownRef" :style="floatingStyles" class="dropdown-list">
        <template #before>
          <div class="search-container">
            <UiInput
              ref="searchRef"
              v-model="search"
              :placeholder="t('search-or-create-tag')"
              accent="brand"
              right-icon="fa:magnifying-glass"
              detached
            />
          </div>
          <div v-if="visibleTags.length > 0" class="selection-actions">
            <UiButton
              :disabled="areAllVisibleTagsSelected"
              accent="brand"
              size="small"
              variant="tertiary"
              @click="selectVisibleTags()"
            >
              {{ t('action:select-all') }}
            </UiButton>
            <UiButton
              :disabled="!isSomeVisibleTagSelected"
              accent="brand"
              size="small"
              variant="tertiary"
              @click="deselectVisibleTags()"
            >
              {{ t('action:deselect-all') }}
            </UiButton>
          </div>
        </template>
        <UiDropdown v-if="options.length === 0" accent="normal" disabled>
          {{ t('no-result') }}
        </UiDropdown>
        <VtsTagSelectOption v-for="option of options" :key="option.id" :option />
        <template #after>
          <div class="scoped-tag-hint typo-body-regular-small">{{ t('scoped-tag-hint') }}</div>
        </template>
      </UiDropdownList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsTagSelectOption from '@core/components/tag-select/VtsTagSelectOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { type FormSelect, useFormSelect, useFormSelectController } from '@core/packages/form-select'
import { useOverlayStore } from '@core/packages/overlay/use-overlay-store.ts'
import { syncRef, unrefElement } from '@vueuse/core'
import { computed, type ComputedRef, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

export type TagSelectSuggestion = {
  tag: string
  info?: string
}

type TagSource = {
  id: string
  label: string
  info?: string
  isNew: boolean
}

type TagOptionProperties = {
  info: string | undefined
  isNew: boolean
  tagAccent: TagAccent
  lock: string | undefined
  busy: ComputedRef<boolean>
}

const {
  tags,
  suggestions = [],
  tagAccent,
  tagLock,
  busyTags = [],
} = defineProps<{
  tags: string[]
  suggestions?: TagSelectSuggestion[]
  tagAccent?: (tag: string) => TagAccent
  // a tag that can't be changed, with the reason
  tagLock?: (tag: string) => string | undefined
  iconOnly?: boolean
  busyTags?: string[]
}>()

const emit = defineEmits<{
  add: [tag: string]
  remove: [tag: string]
}>()

const { t } = useI18n()

const hasTags = computed(() => tags.length > 0)

const triggerIcon = computed<IconName>(() => (hasTags.value ? 'action:edit' : 'action:add'))

const triggerLabel = computed(() => (hasTags.value ? t('action:edit') : t('action:add')))

const search = ref('')

const selectedTags = ref<string[]>([])

const pendingChanges = new Map<string, 'add' | 'remove'>()

function syncSelection() {
  pendingChanges.forEach((change, tag) => {
    if ((change === 'add') === tags.includes(tag)) {
      pendingChanges.delete(tag)
    }
  })

  const addedTags = Array.from(pendingChanges)
    .filter(([, change]) => change === 'add')
    .map(([tag]) => tag)

  selectedTags.value = [...tags.filter(tag => pendingChanges.get(tag) !== 'remove'), ...addedTags]
}

const sources = computed<TagSource[]>(() => {
  const infoByTag = new Map(suggestions.map(({ tag, info }) => [tag, info]))
  const allTags = new Set([...tags, ...suggestions.map(({ tag }) => tag)])
  const searchedTag = search.value.trim()

  const existingSources = Array.from(allTags, tag => ({
    id: tag,
    label: tag,
    info: infoByTag.get(tag),
    isNew: false,
  })).sort((source1, source2) => Number(!tags.includes(source1.id)) - Number(!tags.includes(source2.id)))

  if (searchedTag === '' || allTags.has(searchedTag)) {
    return existingSources
  }

  return [{ id: searchedTag, label: searchedTag, isNew: true }, ...existingSources]
})

const select = useFormSelect(sources, {
  multiple: true,
  searchable: true,
  model: selectedTags,
  option: {
    value: 'id',
    disabled: source => tagLock?.(source.id) !== undefined,
    properties: (source): TagOptionProperties => ({
      info: source.info,
      isNew: source.isNew,
      tagAccent: tagAccent?.(source.id) ?? 'info',
      lock: tagLock?.(source.id),
      busy: computed(() => busyTags.includes(source.id)),
    }),
  },
})

const { options } = select

syncRef(search, select.searchTerm)

const visibleTags = computed(() =>
  options.value.filter(option => !option.properties.isNew).map(option => option.properties.value)
)

const areAllVisibleTagsSelected = computed(() => visibleTags.value.every(tag => selectedTags.value.includes(tag)))

const isSomeVisibleTagSelected = computed(() =>
  visibleTags.value.some(tag => selectedTags.value.includes(tag) && tagLock?.(tag) === undefined)
)

function selectVisibleTags() {
  selectedTags.value = [...new Set([...selectedTags.value, ...visibleTags.value])]
}

function deselectVisibleTags() {
  selectedTags.value = selectedTags.value.filter(
    tag => !visibleTags.value.includes(tag) || tagLock?.(tag) !== undefined
  )
}

const { rootRef, triggerRef, dropdownRef, searchRef, isOpen, closeDropdown, floatingStyles } = useFormSelectController(
  select as FormSelect,
  { pinnedContainer: () => rootRef.value?.parentElement }
)

const triggerButton = useTemplateRef('trigger')

watchEffect(() => {
  const element = unrefElement(triggerButton)

  triggerRef.value = element instanceof HTMLElement ? element : undefined
})

const overlayStore = useOverlayStore()

watch(
  () => overlayStore.overlays.length,
  (count, previousCount) => {
    if (count > previousCount) {
      closeDropdown(false)
    }
  }
)

watch(selectedTags, newTags => {
  newTags
    .filter(tag => !tags.includes(tag) && !pendingChanges.has(tag))
    .forEach(tag => {
      pendingChanges.set(tag, 'add')
      emit('add', tag)
    })

  tags
    .filter(tag => !newTags.includes(tag) && !pendingChanges.has(tag))
    .forEach(tag => {
      pendingChanges.set(tag, 'remove')
      emit('remove', tag)
    })
})

watch(() => tags, syncSelection, { immediate: true })

watch(isOpen, () => {
  pendingChanges.forEach((_change, tag) => {
    if (!busyTags.includes(tag)) {
      pendingChanges.delete(tag)
    }
  })

  syncSelection()
})
</script>

<style lang="postcss" scoped>
.dropdown-list {
  width: max-content;
  min-width: 32rem;
  max-width: calc(100vw - 3.2rem);
  max-height: 36.2rem; /* 8 Dropdown items */
  z-index: 1020;

  .search-container {
    background-color: var(--color-neutral-background-primary);
    padding: 0.4rem;
  }

  .selection-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.8rem;
    padding: 0.4rem 0.8rem;
    background-color: var(--color-neutral-background-secondary);
  }

  .scoped-tag-hint {
    padding: 0.8rem 1.2rem;
    color: var(--color-neutral-txt-secondary);
    background-color: var(--color-neutral-background-disabled);
  }
}
</style>
