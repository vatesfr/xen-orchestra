<template>
  <ComponentStory
    v-slot="{ properties, settings }"
    :params="[
      prop('accent')
        .enum('neutral', 'warning', 'danger')
        .required()
        .preset('neutral')
        .widget()
        .help('Overridden by the accent of the parent VtsInputWrapper when that one is not neutral'),
      prop('maxSize').num().widget().help('Maximum file size in bytes. Larger files are rejected'),
      prop('accept')
        .type('MaybeArray<string>')
        .default('*/*')
        .widget(
          choice(
            { label: 'Any file type', value: '*/*' },
            { label: 'Images', value: 'image/*' },
            { label: 'JSON files', value: '.json' },
            { label: 'Images and JSON files', value: ['image/*', '.json'] }
          )
        )
        .help('A single MIME type or extension, or a list of them. Non-matching files are rejected'),
      prop('acceptLabel')
        .str()
        .widget()
        .help(
          'Readable list of the accepted types shown in the hint. Falls back to `Any file type` or the raw `accept` list'
        ),
      prop('multiple').bool().widget().help('When disabled, only the first accepted file is emitted'),
      prop('required').bool().widget().help('Displayed by the label of the parent VtsInputWrapper'),
      prop('disabled').bool().widget().ctx(),
      event('select').args({ files: 'File[]' }).help('Emitted with the accepted files picked or dropped'),
      event('reject')
        .args({ rejections: 'FileRejection[]' })
        .help('Emitted with the files rejected because of their type or size, with the reason'),
      setting('label').widget(text()).preset('Upload files').help('Label of the parent VtsInputWrapper'),
      setting('message')
        .widget(object())
        .preset([])
        .help(
          'Message of the parent VtsInputWrapper (InputWrapperMessage). A danger message turns the uploader danger'
        ),
    ]"
    :presets
  >
    <VtsInputWrapper :label="settings.label" :message="settings.message">
      <UiFileUploader v-bind="properties" />
    </VtsInputWrapper>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { event, prop, setting } from '@/libs/story/story-param.ts'
import { choice, object, text } from '@/libs/story/story-widget.ts'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiFileUploader from '@core/components/ui/file-uploader/UiFileUploader.vue'

const presets = {
  'Multiple images, max 2 MB': {
    props: {
      accept: 'image/*',
      acceptLabel: 'PNG, JPG or GIF',
      multiple: true,
      maxSize: 2_000_000,
    },
    settings: {
      label: 'Upload images',
    },
  },
  'Single required file': {
    props: {
      accept: '.json',
      acceptLabel: 'JSON',
      multiple: false,
      required: true,
    },
    settings: {
      label: 'Upload a configuration file',
    },
  },
  'With a danger message': {
    settings: {
      message: [{ content: 'A file is required', accent: 'danger' }],
    },
  },
  Disabled: {
    props: {
      disabled: true,
    },
  },
}
</script>
