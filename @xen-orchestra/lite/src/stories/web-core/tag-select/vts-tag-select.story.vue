<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tags').arr('string').required().help('Currently selected tags. The component never mutates it'),
      prop('suggestions').arr('TagSelectSuggestion').preset(suggestions).widget(),
      prop('iconOnly').bool().widget().help('Displays the `Add`/`Edit` trigger as an icon with a tooltip'),
      prop('busy').bool().widget().help('Displays the trigger as busy, e.g. while the tags are being saved'),
      event('save')
        .args({ changes: 'TagSelectChanges' })
        .help('Emitted with the added and removed tags when clicking `Save`. `Cancel` discards the changes'),
    ]"
  >
    <UiTagsList>
      <VtsTag v-for="tag of tags" :key="tag" :value="tag" accent="brand" />
      <VtsTagSelect v-bind="properties" :tags @save="changes => saveTags(changes)" />
    </UiTagsList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import VtsTagSelect, {
  type TagSelectChanges,
  type TagSelectSuggestion,
} from '@core/components/tag-select/VtsTagSelect.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { ref } from 'vue'

const tags = ref(['production', 'env=prod'])

const suggestions: TagSelectSuggestion[] = [
  { tag: 'production' },
  { tag: 'staging' },
  { tag: 'env=prod' },
  { tag: 'env=dev' },
  { tag: 'xo:no-bak', info: 'Excludes the VM from backups' },
  { tag: 'xo:notify-on-snapshot', info: 'Notifies when a snapshot is created' },
]

function saveTags({ added, removed }: TagSelectChanges) {
  tags.value = [...tags.value.filter(tag => !removed.includes(tag)), ...added]
}
</script>
