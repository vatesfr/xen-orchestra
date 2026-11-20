<template>
  <div ref="rootRef" class="vts-tag-select">
    <template v-if="iconOnly">
      <UiButtonIcon
        ref="trigger"
        v-tooltip="triggerLabel"
        :aria-label="triggerLabel"
        :icon="triggerIcon"
        :disabled="busy"
        accent="brand"
        size="small"
      />
      <UiLoader v-if="busy" class="loader" />
    </template>
    <UiButton v-else ref="trigger" :left-icon="triggerIcon" :busy accent="brand" size="small" variant="tertiary">
      {{ triggerLabel }}
    </UiButton>

    <template v-if="isOpen">
      <VtsBackdrop />

      <UiDropdownList
        ref="dropdownRef"
        :class="{ fullscreen: uiStore.isSmall }"
        :style="floatingStyles"
        class="dropdown-list"
      >
        <template #before>
          <div v-if="hasEmptyTag || selectedTags.length > 0" class="current-tags">
            <UiTagsList>
              <VtsTag v-if="hasEmptyTag" value="" accent="brand" />
              <VtsTag
                v-for="tag of sortedSelectedTags"
                :key="tag"
                :value="tag"
                accent="brand"
                removable
                wrap
                @remove="deselectTag(tag)"
              />
            </UiTagsList>
            <VtsIcon class="tags-icon" name="fa:tags" size="medium" />
          </div>
          <div class="search-container">
            <UiInput
              ref="searchRef"
              v-model="search"
              :placeholder="t('search-or-create-tag')"
              accent="brand"
              right-icon="fa:magnifying-glass"
              clearable
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
          <div class="footer">
            <UiButton accent="brand" size="small" variant="secondary" @click="cancel()">
              {{ t('cancel') }}
            </UiButton>
            <UiButton accent="brand" size="small" variant="primary" @click="save()">
              {{ t('action:save') }}
            </UiButton>
          </div>
        </template>
      </UiDropdownList>
    </template>
  </div>
</template>

<script lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import VtsTagSelectOption from '@core/components/tag-select/VtsTagSelectOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLoader from '@core/components/ui/loader/UiLoader.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { useTagSelectKeyboard } from '@core/composables/tag-select-keyboard.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconName } from '@core/icons'
import { type FormSelect, useFormSelect, useFormSelectController } from '@core/packages/form-select'
import { useUiStore } from '@core/stores/ui.store.ts'
import { sortTags } from '@core/utils/sort-tags.util.ts'
import { syncRef, unrefElement } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

export type TagSelectSuggestion = {
  tag: string
  info?: string
}

export type TagSelectChanges = {
  added: string[]
  removed: string[]
}

type TagSource = {
  id: string
  label: string
  info?: string
  isNew: boolean
}

export type TagOptionProperties = {
  info: string | undefined
  isNew: boolean
}

const { tags, suggestions = [] } = defineProps<{
  tags: string[]
  suggestions?: TagSelectSuggestion[]
  iconOnly?: boolean
  busy?: boolean
}>()

const emit = defineEmits<{
  save: [changes: TagSelectChanges]
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const hasTags = computed(() => tags.length > 0)

// The empty tag can't be created from XO 6: it is only displayed when it was set from elsewhere
const hasEmptyTag = computed(() => tags.includes(''))

const editableTags = computed(() => tags.filter(tag => tag !== ''))

const triggerIcon = computed<IconName>(() => (hasTags.value ? 'action:edit' : 'action:add'))

const triggerLabel = computed(() => (hasTags.value ? t('action:edit') : t('action:add')))

const search = ref('')

const selectedTags = ref<string[]>([])

const sortedSelectedTags = computed(() => sortTags(selectedTags.value))

const initialTags = ref<string[]>([])

const changes = computed<TagSelectChanges>(() => ({
  added: selectedTags.value.filter(tag => !initialTags.value.includes(tag)),
  removed: initialTags.value.filter(tag => !selectedTags.value.includes(tag)),
}))

const hasChanges = computed(() => changes.value.added.length > 0 || changes.value.removed.length > 0)

const createdTags = ref<string[]>([])

const existingTags = computed(
  () =>
    new Set([
      ...initialTags.value,
      ...suggestions.map(({ tag }) => tag).filter(tag => tag !== ''),
      ...editableTags.value,
    ])
)

const sources = computed<TagSource[]>(() => {
  const infoByTag = new Map(suggestions.map(({ tag, info }) => [tag, info]))
  const allTags = new Set([...createdTags.value, ...existingTags.value])
  const searchedTag = search.value.trim()

  const existingSources = sortTags([...allTags]).map(tag => ({
    id: tag,
    label: tag,
    info: infoByTag.get(tag),
    isNew: false,
  }))

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
    properties: (source): TagOptionProperties => ({
      info: source.info,
      isNew: source.isNew,
    }),
  },
})

const { options } = select

syncRef(search, select.searchTerm)

const visibleTags = computed(() =>
  options.value.filter(option => !option.properties.isNew).map(option => option.properties.value)
)

const areAllVisibleTagsSelected = computed(() => visibleTags.value.every(tag => selectedTags.value.includes(tag)))

const isSomeVisibleTagSelected = computed(() => visibleTags.value.some(tag => selectedTags.value.includes(tag)))

function selectVisibleTags() {
  selectedTags.value = [...new Set([...selectedTags.value, ...visibleTags.value])]
}

function deselectTag(tag: string) {
  selectedTags.value = selectedTags.value.filter(selectedTag => selectedTag !== tag)
}

function deselectVisibleTags() {
  selectedTags.value = selectedTags.value.filter(tag => !visibleTags.value.includes(tag))
}

const { rootRef, triggerRef, dropdownRef, searchRef, isOpen, floatingStyles, closeDropdown } = useFormSelectController(
  select as FormSelect,
  { fullscreen: () => uiStore.isSmall }
)

useTagSelectKeyboard({
  target: () => unrefElement(dropdownRef),
  itemSelector: '.vts-tag-select-option',
  onCancel: () => cancel(),
  onFocusLost: () => searchRef.value?.focus?.(),
})

const triggerButton = useTemplateRef('trigger')

watchEffect(() => {
  const element = unrefElement(triggerButton)

  triggerRef.value = element instanceof HTMLElement ? element : undefined
})

function cancel() {
  closeDropdown(true)
}

function save() {
  if (hasChanges.value) {
    emit('save', changes.value)
  }

  closeDropdown(true)
}

watch(selectedTags, newTags => {
  const newlyCreatedTags = newTags.filter(tag => !existingTags.value.has(tag) && !createdTags.value.includes(tag))

  if (newlyCreatedTags.length > 0) {
    createdTags.value = [...newlyCreatedTags, ...createdTags.value]
  }
})

watch(isOpen, open => {
  if (!open) {
    return
  }

  initialTags.value = [...editableTags.value]
  createdTags.value = []
  selectedTags.value = [...editableTags.value]
})
</script>

<style lang="postcss" scoped>
.vts-tag-select {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;

  .loader {
    color: var(--color-brand-item-base);
  }

  .dropdown-list {
    width: max-content;
    min-width: 32rem;
    max-width: calc(100vw - 3.2rem);
    z-index: 1020;

    :deep(.container) {
      max-height: 27rem;
    }

    .current-tags {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 0.8rem;
      max-height: 11rem;
      padding: 0.8rem 1.2rem;
      overflow-y: auto;
      border-bottom: 0.1rem solid var(--color-neutral-border);
      contain: inline-size;

      .tags-icon {
        position: sticky;
        top: 0;
        flex-shrink: 0;
        color: var(--color-brand-item-base);
      }
    }

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

    .footer {
      display: flex;
      gap: 0.8rem;
      padding: 0.8rem 1.2rem;
      border-top: 0.1rem solid var(--color-neutral-border);
      background-color: var(--color-neutral-background-secondary);
    }

    &.fullscreen {
      position: fixed;
      inset: 0;
      width: 100dvw;
      min-width: 0;
      max-width: none;
      height: 100dvh;
      max-height: none;
      border: none;
      border-radius: 0;

      :deep(.container) {
        flex: 1 1 auto;
        max-height: none;
      }
    }
  }
}
</style>
