<template>
  <VtsTreeItem :expanded="isExpanded" :has-children="canToggle">
    <div class="vm-backup-archive-restore-files-tree-item">
      <VtsTreeItemToggle size="medium" @toggle="emit('toggle', node.path)" />
      <span class="label">
        <VtsIcon :name="node.isDirectory ? 'fa:folder-closed' : 'fa:file'" size="medium" />
        <span
          class="name text-ellipsis"
          :class="node.isWhole || !node.isDirectory ? 'typo-body-bold-small' : 'typo-body-regular-small'"
        >
          {{ node.isDirectory && !isRoot ? `${node.name}/` : node.name }}
        </span>
      </span>
      <span class="meta typo-body-regular-small">{{ meta }}</span>
    </div>
    <template v-if="node.isDirectory && !node.isWhole" #sublist>
      <VtsTreeList>
        <VmBackupArchiveRestoreFilesTreeItem
          v-for="child of node.children"
          :key="child.path"
          :node="child"
          :expanded-paths
          @toggle="emit('toggle', $event)"
        />
      </VtsTreeList>
    </template>
  </VtsTreeItem>
</template>

<script lang="ts" setup>
import {
  type BackupArchiveFilesTreeNode,
  countTreeSelection,
  FILES_ROOT_PATH,
} from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsTreeItem from '@core/components/tree/VtsTreeItem.vue'
import VtsTreeItemToggle from '@core/components/tree/VtsTreeItemToggle.vue'
import VtsTreeList from '@core/components/tree/VtsTreeList.vue'
import { formatSize } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { node, expandedPaths } = defineProps<{
  node: BackupArchiveFilesTreeNode
  expandedPaths: string[]
}>()

const emit = defineEmits<{
  toggle: [path: string]
}>()

const { t } = useI18n()

const isRoot = computed(() => node.path === FILES_ROOT_PATH)

const canToggle = computed(() => !isRoot.value && node.isDirectory && !node.isWhole && node.children.length > 0)

const isExpanded = computed(() => isRoot.value || expandedPaths.includes(node.path))

const meta = computed(() => {
  if (node.isWhole) {
    return t('whole-folder')
  }

  if (!node.isDirectory) {
    return node.size === undefined ? '' : formatSize(node.size, 1)
  }

  return canToggle.value && !isExpanded.value ? t('n-selected', { n: countTreeSelection(node) }) : ''
})
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-files-tree-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 3.6rem;

  .label {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 1.2rem;
    min-width: 0;
  }

  .meta {
    flex-shrink: 0;
  }
}
</style>
