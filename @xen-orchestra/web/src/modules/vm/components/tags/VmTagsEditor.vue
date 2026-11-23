<template>
  <div class="vm-tags-editor">
    <div class="header">
      <span class="label">{{ t('tags') }}</span>
      <VtsTagSelect
        :tags="vm.tags"
        :suggestions="tagSuggestions"
        :icon-only
        :busy="isSaving"
        @save="changes => saveTags(changes)"
      />
      <div v-if="slots.addons" class="addons">
        <slot name="addons" />
      </div>
    </div>
    <UiTagsList v-if="sortedTags.length > 0">
      <VtsTag v-for="tag of sortedTags" :key="tag" :value="tag" :wrap accent="brand" />
    </UiTagsList>
  </div>
</template>

<script lang="ts" setup>
import { useVmTagSuggestions } from '@/modules/vm/composables/use-vm-tag-suggestions.composable.ts'
import { useVmTagsEdition } from '@/modules/vm/composables/use-vm-tags-edition.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import VtsTagSelect from '@core/components/tag-select/VtsTagSelect.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { sortTags } from '@core/utils/sort-tags.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
  wrap?: boolean
}>()

const slots = defineSlots<{
  addons?(): any
}>()

const { t } = useI18n()

const { saveTags, isSaving } = useVmTagsEdition(() => vm)

const { tagSuggestions } = useVmTagSuggestions()

const sortedTags = computed(() => sortTags(vm.tags))
</script>

<style lang="postcss" scoped>
.vm-tags-editor {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    height: 1lh;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .addons {
      display: flex;
      gap: 0.8rem;
      margin-inline-start: auto;
    }
  }
}
</style>
