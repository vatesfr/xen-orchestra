import type { BackupArchiveSelectedItem } from '@/modules/backup-archive/utils/xo-backup-archive-files.util.ts'
import type { SelectionBindings } from '@core/composables/table-selection.composable.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter, type Ref } from 'vue'

export type BackupArchiveFileRow = {
  name: string
  path: string
  isDirectory: boolean
  size: number | undefined
}

export type BackupArchiveFileRowState = {
  checked: boolean
  inherited: boolean
  partial: boolean
  insideCount: number
}

export function useBackupArchiveFilesSelection(
  selection: Ref<BackupArchiveSelectedItem[]>,
  rawRows: MaybeRefOrGetter<BackupArchiveFileRow[]>,
  rawPageRows: MaybeRefOrGetter<BackupArchiveFileRow[]>
) {
  const rows = toComputed(rawRows)
  const pageRows = toComputed(rawPageRows)

  const selectedPaths = computed(() => selection.value.map(item => item.path))

  const selectedDirectoryPaths = computed(() => selectedPaths.value.filter(path => path.endsWith('/')))

  const states = computed(
    () =>
      new Map<string, BackupArchiveFileRowState>(
        rows.value.map(row => {
          const inherited = selectedDirectoryPaths.value.some(path => path !== row.path && row.path.startsWith(path))
          const checked = inherited || selectedPaths.value.includes(row.path)
          const insideCount =
            row.isDirectory && !checked
              ? selectedPaths.value.filter(path => path !== row.path && path.startsWith(row.path)).length
              : 0

          return [row.path, { checked, inherited, partial: insideCount > 0, insideCount }]
        })
      )
  )

  function getState(row: BackupArchiveFileRow): BackupArchiveFileRowState {
    return states.value.get(row.path) ?? { checked: false, inherited: false, partial: false, insideCount: 0 }
  }

  function select(rowsToSelect: BackupArchiveFileRow[]) {
    const paths = new Set(rowsToSelect.map(row => row.path))

    const directoryPaths = rowsToSelect.filter(row => row.isDirectory).map(row => row.path)

    selection.value = [
      ...selection.value.filter(
        item => !paths.has(item.path) && !directoryPaths.some(path => item.path.startsWith(path))
      ),
      ...rowsToSelect.map(row => ({ path: row.path, size: row.size })),
    ]
  }

  function unselect(rowsToUnselect: BackupArchiveFileRow[]) {
    const paths = new Set(rowsToUnselect.map(row => row.path))

    selection.value = selection.value.filter(item => !paths.has(item.path))
  }

  function isSelectable(row: BackupArchiveFileRow) {
    return !getState(row).inherited
  }

  function toggle(row: BackupArchiveFileRow) {
    if (!isSelectable(row)) {
      return
    }

    if (selectedPaths.value.includes(row.path)) {
      unselect([row])
    } else {
      select([row])
    }
  }

  const pageSelectionModel = computed<boolean | undefined>({
    get() {
      if (pageRows.value.length > 0 && pageRows.value.every(row => getState(row).checked)) {
        return true
      }

      return pageRows.value.some(row => getState(row).checked || getState(row).partial) ? undefined : false
    },
    set(shouldSelect) {
      const selectableRows = pageRows.value.filter(isSelectable)

      if (shouldSelect === true) {
        select(selectableRows.filter(row => !getState(row).checked))
      } else {
        unselect(selectableRows)
      }
    },
  })

  const selectionBindings = computed<SelectionBindings>(() => {
    const selectedCount = rows.value.filter(row => getState(row).checked).length
    const pageSelectedCount = pageRows.value.filter(row => getState(row).checked).length

    return {
      selectedCount,
      hiddenSelectedCount: selectedCount - pageSelectedCount,
      filteredCount: rows.value.length,
      areAllPageItemsSelected: pageRows.value.length > 0 && pageSelectedCount === pageRows.value.length,
      areAllFilteredItemsSelected: rows.value.length > 0 && selectedCount === rows.value.length,
      areAllItemsSelected: rows.value.length > 0 && selectedCount === rows.value.length,
      onSelectAll: () => select(rows.value.filter(row => isSelectable(row) && !getState(row).checked)),
      onClearSelection: () => unselect(rows.value),
    }
  })

  return {
    getState,
    toggle,
    pageSelectionModel,
    selectionBindings,
  }
}
