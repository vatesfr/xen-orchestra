<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('file').type('File').required().help('Only `name` and `size` are read. Driven by the story settings tab'),
      prop('status').enum('uploading', 'uploaded', 'error').required().preset('uploading').widget(),
      prop('error')
        .type('MaybeArray<string>')
        .widget(object())
        .help('Displayed below the file as a danger message, one line per message, whatever the status'),
      event('retry').help('Emitted when the user clicks the Retry button, only shown when status is `error`'),
      event('cancel').help('Emitted when the user clicks the cancel button, only shown when status is `uploading`'),
      event('delete').help('Emitted when the user clicks the delete button, only shown when status is `uploaded`'),
      setting('fileName')
        .widget(text())
        .preset('debian-12-generic-amd64.qcow2')
        .help('Names too long for the available width are truncated in the middle, keeping the extension visible'),
      setting('fileSize')
        .widget(number())
        .preset(DEFAULT_FILE_SIZE)
        .help('File size in bytes. Only displayed when status is `uploaded`'),
    ]"
    :presets
  >
    <ul>
      <UiFileItem v-bind="properties" :file="createStoryFile(settings.fileName, settings.fileSize)" />
    </ul>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { createStoryFile } from '@/libs/story/story-file.ts'
import { event, prop, setting } from '@/libs/story/story-param.ts'
import { number, object, text } from '@/libs/story/story-widget.ts'
import UiFileItem from '@core/components/ui/file-item/UiFileItem.vue'

const DEFAULT_FILE_SIZE = 102_020_102

const presets = {
  Uploading: {
    props: {
      status: 'uploading',
      error: undefined,
    },
  },
  Uploaded: {
    props: {
      status: 'uploaded',
      error: undefined,
    },
  },
  'Failed with a message': {
    props: {
      status: 'error',
      error: 'File size exceeds 5 MB',
    },
  },
  'Failed with several messages': {
    props: {
      status: 'error',
      error: ['File size exceeds 5 MB', 'File type not accepted'],
    },
  },
  'Truncated file name': {
    props: {
      status: 'uploaded',
      error: undefined,
    },
    settings: {
      fileName: 'a-very-long-file-name-that-only-gets-truncated-when-the-available-width-is-too-small.qcow2',
    },
  },
}
</script>
