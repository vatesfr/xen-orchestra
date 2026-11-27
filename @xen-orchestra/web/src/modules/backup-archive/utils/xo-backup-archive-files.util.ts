import { BASE_URL } from '@/shared/utils/fetch.util.ts'
import { timeFormat } from 'd3-time-format'

export const FILES_ROOT_PATH = '/'

export type BackupArchiveFilesFormat = 'zip' | 'tgz'

export type BackupArchiveSelectedItem = {
  path: string
  size: number | undefined
}

export type BackupArchiveFilesTreeNode = {
  name: string
  path: string
  isDirectory: boolean
  isWhole: boolean
  size: number | undefined
  children: BackupArchiveFilesTreeNode[]
}

export function toDirectoryPath(segments: string[]): string {
  return segments.length === 0 ? FILES_ROOT_PATH : `${FILES_ROOT_PATH}${segments.join('/')}/`
}

const formatFileNameDate = timeFormat('%Y-%m-%d_%H%M')

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/^[_.]+|[_.]+$/g, '')
}

export function buildBackupArchiveFileName({
  vmName,
  diskName,
  partitionName,
  timestamp,
  extension,
}: {
  vmName: string
  diskName?: string
  partitionName?: string
  timestamp: number
  extension: string
}): string {
  const parts = [vmName, diskName, formatFileNameDate(new Date(timestamp)), partitionName]
    .map(part => (part === undefined ? '' : slugify(part)))
    .filter(part => part !== '')

  return `${parts.join('_')}.${extension}`
}

export function buildBackupArchiveFilesUrl({
  archiveId,
  diskId,
  partitionId,
  path,
}: {
  archiveId: string
  diskId: string
  partitionId: string | undefined
  path: string
}): string {
  const partitionPart = partitionId === undefined ? '' : `/partitions/${encodeURIComponent(partitionId)}`

  return `${BASE_URL}/backup-archives/${encodeURIComponent(archiveId)}/disks/${encodeURIComponent(diskId)}${partitionPart}/files?path=${encodeURIComponent(path)}`
}

export function buildBackupArchiveFilesDownloadUrl({
  archiveId,
  diskId,
  partitionId,
  paths,
  format,
}: {
  archiveId: string
  diskId: string
  partitionId: string | undefined
  paths: string[]
  format: BackupArchiveFilesFormat
}): string {
  const partitionPart = partitionId === undefined ? '' : `/partitions/${encodeURIComponent(partitionId)}`

  const query = paths.map(path => `paths=${encodeURIComponent(path)}`).join('&')

  return `${BASE_URL}/backup-archives/${encodeURIComponent(archiveId)}/disks/${encodeURIComponent(diskId)}${partitionPart}/files.${format}?${query}`
}

export function compareFilesByDirectoryThenName(
  a: { isDirectory: boolean; name: string },
  b: { isDirectory: boolean; name: string }
): number {
  return Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name)
}

function sortTreeNodes(nodes: BackupArchiveFilesTreeNode[]): BackupArchiveFilesTreeNode[] {
  return nodes
    .sort(compareFilesByDirectoryThenName)
    .map(node => ({ ...node, children: sortTreeNodes(node.children) }))
}

export function buildBackupArchiveFilesTree(
  rootName: string,
  selection: BackupArchiveSelectedItem[]
): BackupArchiveFilesTreeNode {
  const root: BackupArchiveFilesTreeNode = {
    name: rootName,
    path: FILES_ROOT_PATH,
    isDirectory: true,
    isWhole: false,
    size: undefined,
    children: [],
  }

  for (const { path, size } of selection) {
    const isDirectory = path.endsWith('/')
    const segments = path.split('/').filter(segment => segment !== '')
    let parent = root

    segments.forEach((name, index) => {
      const isLast = index === segments.length - 1
      const nodePath = `${FILES_ROOT_PATH}${segments.slice(0, index + 1).join('/')}${isLast && !isDirectory ? '' : '/'}`

      let node = parent.children.find(child => child.path === nodePath)

      if (node === undefined) {
        node = {
          name,
          path: nodePath,
          isDirectory: !isLast || isDirectory,
          isWhole: isLast && isDirectory,
          size: isLast ? size : undefined,
          children: [],
        }
        parent.children.push(node)
      }

      parent = node
    })
  }

  return { ...root, children: sortTreeNodes(root.children) }
}

export function countTreeSelection(node: BackupArchiveFilesTreeNode): number {
  if (node.isWhole || !node.isDirectory) {
    return 1
  }

  return node.children.reduce((total, child) => total + countTreeSelection(child), 0)
}
