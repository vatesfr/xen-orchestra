<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent').type('RichCheckboxAccent').required().enum('brand', 'warning', 'danger').preset('brand').widget(),
      prop('label').str().widget().preset('Backup repositories'),
      prop('info').str().widget(),
      prop('message').str().widget().help('Only displayed when the accent is not brand'),
      prop('vertical').bool().widget().preset(true),
      slot().help('Meant to receive UiRichCheckbox components, and UiGroupSubcategory components in vertical mode'),
      slot('label').help('Meant to receive a UiLabel component or another component'),
      slot('info').help('Meant to receive a UiInfo component or another component'),
      slot('message').help('Meant to receive a UiInfo component or another component'),
    ]"
  >
    <UiRichCheckboxGroup v-bind="properties">
      <template v-for="category of properties.vertical ? categories : horizontalCategories" :key="category.title">
        <UiGroupSubcategory v-if="properties.vertical">
          {{ category.title }}
          <template v-if="category.info" #info>{{ category.info }}</template>
        </UiGroupSubcategory>
        <UiRichCheckbox
          v-for="option of category.options"
          :key="option.value"
          v-model="selectedRepositories"
          :accent="properties.accent"
          :value="option.value"
          :tag="option.tag"
          :description="option.description"
          :disabled="option.disabled"
          icon="fa:server"
        >
          {{ option.label }}
        </UiRichCheckbox>
      </template>
    </UiRichCheckboxGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import UiGroupSubcategory from '@core/components/ui/group-subcategory/UiGroupSubcategory.vue'
import UiRichCheckbox from '@core/components/ui/rich-checkbox/UiRichCheckbox.vue'
import UiRichCheckboxGroup from '@core/components/ui/rich-checkbox-group/UiRichCheckboxGroup.vue'
import { ref } from 'vue'

type StoryOption = {
  value: string
  label: string
  description: string
  tag?: string
  disabled?: boolean
}

const selectedRepositories = ref(['nfs-backups', 'smb-archive'])

const categories: { title: string; info?: string; options: StoryOption[] }[] = [
  {
    title: 'Category 1',
    options: [
      { value: 'rd-s3', label: 'RD - S3', description: '3.1 TiB free', tag: 'Source' },
      { value: 'nfs-backups', label: 'NFS backups', description: '4.2 TiB free' },
      { value: 'local-backups', label: 'Local backups', description: '120 GiB free', disabled: true },
    ],
  },
  {
    title: 'Category 2',
    info: 'Info',
    options: [{ value: 'smb-archive', label: 'SMB archive', description: '900 GiB free' }],
  },
]

const horizontalCategories = categories.slice(0, 1)
</script>
