<template>
  <ComponentStory :params="[slot().help('Meant to receive UiFileItem components')]">
    <UiFileList>
      <UiFileItem
        v-for="storyFile of storyFiles"
        :key="storyFile.file.name"
        :file="storyFile.file"
        :status="storyFile.status"
        :error="storyFile.error"
      />
    </UiFileList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { createStoryFile } from '@/libs/story/story-file.ts'
import { slot } from '@/libs/story/story-param.ts'
import UiFileItem, { type FileUploadStatus } from '@core/components/ui/file-item/UiFileItem.vue'
import UiFileList from '@core/components/ui/file-list/UiFileList.vue'

type StoryFile = {
  file: File
  status: FileUploadStatus
  error?: string
}

const storyFiles: StoryFile[] = [
  { file: createStoryFile('debian-12-generic-amd64.qcow2', 102_020_102), status: 'uploaded' },
  { file: createStoryFile('xcp-ng-8.3.0.iso', 681_574_400), status: 'uploading' },
  {
    file: createStoryFile('backup-metadata.json', 4_096),
    status: 'error',
    error: 'Upload failed: connection lost',
  },
]
</script>
