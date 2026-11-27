<template>
  <div class="vm-backup-archive-restore-files-explorer">
    <VmBackupArchiveRestoreFilesBreadcrumb :root-label :segments @navigate="navigateTo($event)" />
    <VmBackupArchiveRestoreFilesTable
      v-model="selection"
      :rows
      :busy="!areFilesReady && !hasFilesError"
      :error="hasFilesError"
      @open="open($event)"
    />
    <UiInfo v-if="errorMessage !== undefined" accent="danger" wrap>{{ errorMessage }}</UiInfo>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFilesBreadcrumb from '@/modules/backup-archive/components/form/files/VmBackupArchiveRestoreFilesBreadcrumb.vue'
import VmBackupArchiveRestoreFilesTable from '@/modules/backup-archive/components/form/files/VmBackupArchiveRestoreFilesTable.vue'
import type { BackupArchiveFileRow } from '@/modules/backup-archive/composables/use-backup-archive-files-selection.composable.ts'
import { useXoVmBackupArchiveFiles } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-files.ts'
import {
  type BackupArchiveSelectedItem,
  compareFilesByDirectoryThenName,
  toDirectoryPath,
} from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed, ref } from 'vue'

const { archiveId, diskId, partitionId, error } = defineProps<{
  archiveId: string
  diskId: string
  partitionId: string | undefined
  rootLabel: string
  error?: InputWrapperMessage
}>()

const selection = defineModel<BackupArchiveSelectedItem[]>({ required: true })

const segments = ref<string[]>([])

const currentPath = computed(() => toDirectoryPath(segments.value))

const { files, areFilesReady, hasFilesError } = useXoVmBackupArchiveFiles(
  undefined,
  () => archiveId,
  () => diskId,
  () => partitionId,
  currentPath
)

const rows = computed<BackupArchiveFileRow[]>(() =>
  files.value
    .map(file => ({
      name: file.name,
      path: `${currentPath.value}${file.name}`,
      isDirectory: !file.isFile,
      size: file.size,
    }))
    .sort(compareFilesByDirectoryThenName)
)

const errorMessage = computed(() => formatErrorMessage(error))

function open(row: BackupArchiveFileRow) {
  segments.value = [...segments.value, row.name.replace(/\/$/, '')]
}

function navigateTo(depth: number) {
  segments.value = segments.value.slice(0, depth)
}
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-files-explorer {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
}
</style>
