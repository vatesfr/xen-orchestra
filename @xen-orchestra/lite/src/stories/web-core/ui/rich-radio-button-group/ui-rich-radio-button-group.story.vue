<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('accent')
        .type('RichRadioButtonAccent')
        .required()
        .enum('brand', 'warning', 'danger')
        .preset('brand')
        .widget(),
      prop('label').str().widget().preset('Restore type'),
      prop('info').str().widget(),
      prop('message').str().widget().help('Only displayed when the accent is not brand'),
      prop('vertical').bool().widget().preset(true),
      slot().help('Meant to receive UiRichRadioButton components, and UiGroupSubcategory components in vertical mode'),
      slot('label').help('Meant to receive a UiLabel component or another component'),
      slot('info').help('Meant to receive a UiInfo component or another component'),
      slot('message').help('Meant to receive a UiInfo component or another component'),
    ]"
  >
    <UiRichRadioButtonGroup v-bind="properties">
      <template v-for="category of properties.vertical ? categories : horizontalCategories" :key="category.title">
        <UiGroupSubcategory v-if="properties.vertical">
          {{ category.title }}
          <template #info>{{ category.info }}</template>
        </UiGroupSubcategory>
        <UiRichRadioButton
          v-for="option of category.options"
          :key="option.value"
          v-model="selectedRadio"
          :accent="properties.accent"
          :value="option.value"
          :icon="option.icon"
          :description="option.description"
          :disabled="option.disabled"
        >
          {{ option.label }}
          <template v-if="option.tag" #tag>
            <UiTag :accent="option.tag.accent" variant="secondary">{{ option.tag.label }}</UiTag>
          </template>
        </UiRichRadioButton>
      </template>
    </UiRichRadioButtonGroup>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param.ts'
import type { IconName } from '@core/icons'
import UiGroupSubcategory from '@core/components/ui/group-subcategory/UiGroupSubcategory.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import UiRichRadioButtonGroup from '@core/components/ui/rich-radio-button-group/UiRichRadioButtonGroup.vue'
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { ref } from 'vue'

type StoryOption = {
  value: string
  label: string
  description: string
  icon: IconName
  tag?: { label: string; accent: TagAccent }
  disabled?: boolean
}

const selectedRadio = ref('copy-then-start')

const categories: { title: string; info: string; options: StoryOption[] }[] = [
  {
    title: 'Into a pool',
    info: 'Writes to a pool',
    options: [
      {
        value: 'copy-then-start',
        label: 'Copy, then start',
        description:
          'Copy the disks to a storage of the pool, then start the VM. When a snapshot of the VM is still in the pool, only the blocks that differ are transferred, if possible.',
        icon: 'action:copy',
        tag: { label: 'Default', accent: 'info' },
      },
      {
        value: 'start-now',
        label: 'Start now',
        description: 'Start the VM right away from the backup. What it writes goes to a cache storage.',
        icon: 'status:running',
        tag: { label: 'Live restore', accent: 'neutral' },
      },
      {
        value: 'attach-disk',
        label: 'Attach a disk to a running VM',
        description: 'Serve a disk of the backup, read-only, to an existing VM. Nothing is copied.',
        icon: 'action:attach',
      },
    ],
  },
  {
    title: 'Out of the backup',
    info: 'Nothing written to a pool',
    options: [
      {
        value: 'download-files',
        label: 'Download files',
        description:
          'Browse a partition of a disk and download individual files or folders. Best for a small amount of data.',
        icon: 'action:download',
      },
      {
        value: 'export-disk',
        label: 'Export a disk',
        description: 'Convert one disk to qcow2, vmdk, vhd or raw, then download it.',
        icon: 'action:download',
      },
      {
        value: 'export-vm',
        label: 'Export the VM',
        description: 'Build an XVA from the backup, to import into XCP-ng or XenServer.',
        icon: 'action:download',
        disabled: true,
      },
    ],
  },
]

const horizontalCategories = categories.slice(0, 1)
</script>
