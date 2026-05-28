import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'

export function isSrWritable(sr: FrontXoSr) {
  return sr.content_type !== 'iso' && sr.size > 0
}
