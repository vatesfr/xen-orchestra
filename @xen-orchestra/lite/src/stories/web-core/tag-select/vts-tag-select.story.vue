<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('tags').arr('string').required().help('Currently selected tags. The component never mutates it'),
      prop('suggestions').arr('TagSelectSuggestion').preset(suggestions).widget(),
      prop('tagAccent')
        .type('(tag: string) => TagAccent')
        .preset(getTagAccent)
        .help('Accent of each tag in the dropdown. Defaults to `info`'),
      prop('iconOnly').bool().widget().help('Displays the `Add`/`Edit` trigger as an icon with a tooltip'),
      prop('busyTags')
        .arr('string')
        .widget()
        .help('Tags being added or removed, displayed with a loader at the end of their option in the dropdown'),
      event('add').args({ tag: 'string' }).help('Emitted when a tag is selected or created'),
      event('remove').args({ tag: 'string' }).help('Emitted when a tag is unselected'),
    ]"
  >
    <UiTagsList>
      <VtsTag v-for="tag of tags" :key="tag" :accent="getTagAccent(tag)" :value="tag" />
      <VtsTagSelect v-bind="properties" :tags @add="addTag" @remove="removeTag" />
    </UiTagsList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop } from '@/libs/story/story-param.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import VtsTagSelect, { type TagSelectSuggestion } from '@core/components/tag-select/VtsTagSelect.vue'
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

function getTagAccent(tag: string): TagAccent {
  return tag.startsWith('xo:') ? 'warning' : 'info'
}

function addTag(tag: string) {
  tags.value = [...tags.value, tag]
}

function removeTag(tag: string) {
  tags.value = tags.value.filter(currentTag => currentTag !== tag)
}
</script>
