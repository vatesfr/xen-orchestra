<template>
  <VtsTreeList class="vm-backup-archive-restore-files-tree" :aria-label="t('files-to-download')">
    <VmBackupArchiveRestoreFilesTreeItem :node="tree" :expanded-paths @toggle="toggle($event)" />
  </VtsTreeList>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFilesTreeItem from '@/modules/backup-archive/components/form/files/VmBackupArchiveRestoreFilesTreeItem.vue'
import {
  type BackupArchiveSelectedItem,
  buildBackupArchiveFilesTree,
} from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { rootLabel, selection } = defineProps<{
  rootLabel: string
  selection: BackupArchiveSelectedItem[]
}>()

const { t } = useI18n()

const tree = computed(() => buildBackupArchiveFilesTree(rootLabel, selection))

const expandedPaths = ref<string[]>([])

function toggle(path: string) {
  expandedPaths.value = expandedPaths.value.includes(path)
    ? expandedPaths.value.filter(expandedPath => expandedPath !== path)
    : [...expandedPaths.value, path]
}
</script>
