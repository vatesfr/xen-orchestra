<template>
  <ComponentStory
    v-slot="{ settings }"
    :params="[
      slot().help('Meant to receive a UiFileUploader component, inside a VtsInputWrapper in a form'),
      slot('file-list').help('Meant to receive a UiFileList component'),
      setting('multiple')
        .widget(boolean())
        .preset(true)
        .help('When disabled, a new pick replaces the listed files: the replacement is up to the consumer'),
    ]"
  >
    <VtsFileUploaderContainer>
      <VtsInputWrapper label="Upload images" :message="rejectionMessages">
        <UiFileUploader
          accent="neutral"
          accept="image/*"
          accept-label="PNG, JPG or GIF"
          :multiple="settings.multiple"
          :max-size="MAX_FILE_SIZE"
          @select="files => addFiles(files, settings.multiple)"
          @reject="rejections => showRejections(rejections)"
        />
      </VtsInputWrapper>
      <template #file-list>
        <UiFileList>
          <UiFileItem
            v-for="storyFile of storyFiles"
            :key="storyFile.file.name"
            :file="storyFile.file"
            :status="storyFile.status"
            :error="storyFile.error"
            @delete="deleteFile(storyFile.file)"
          />
        </UiFileList>
      </template>
    </VtsFileUploaderContainer>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { createStoryFile } from '@/libs/story/story-file.ts'
import { setting, slot } from '@/libs/story/story-param.ts'
import { boolean } from '@/libs/story/story-widget.ts'
import VtsFileUploaderContainer from '@core/components/file-uploader-container/VtsFileUploaderContainer.vue'
import VtsInputWrapper, { type InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiFileItem, { type FileUploadStatus } from '@core/components/ui/file-item/UiFileItem.vue'
import UiFileList from '@core/components/ui/file-list/UiFileList.vue'
import UiFileUploader, { type FileRejection } from '@core/components/ui/file-uploader/UiFileUploader.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { ref } from 'vue'

type StoryFile = {
  file: File
  status: FileUploadStatus
  error?: string[]
}

const MAX_FILE_SIZE = 2_000_000

const storyFiles = ref<StoryFile[]>([
  { file: createStoryFile('debian-12-generic-amd64.qcow2', 102_020_102), status: 'uploaded' },
  { file: createStoryFile('xcp-ng-8.3.0.iso', 681_574_400), status: 'uploading' },
  {
    file: createStoryFile('backup-metadata.json', 4_096),
    status: 'error',
    error: ['Upload failed: connection lost', 'Retried 3 times'],
  },
])

const rejectionMessages = ref<InputWrapperMessage>([])

function addFiles(files: File[], multiple: boolean) {
  const pickedFiles = files.map(file => ({ file, status: 'uploaded' }) satisfies StoryFile)

  storyFiles.value = multiple ? [...storyFiles.value, ...pickedFiles] : pickedFiles
  rejectionMessages.value = []
}

function showRejections(rejections: FileRejection[]) {
  rejectionMessages.value = rejections.map(({ file, reason }) => ({
    content:
      reason === 'type'
        ? `${file.name}: file type not accepted`
        : `${file.name}: file larger than ${formatSize(MAX_FILE_SIZE, 0)}`,
    accent: 'danger' as const,
  }))
}

function deleteFile(file: File) {
  storyFiles.value = storyFiles.value.filter(storyFile => storyFile.file !== file)
}
</script>
