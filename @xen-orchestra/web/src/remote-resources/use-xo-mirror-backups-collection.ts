import { useXoCollectionState } from '@/composables/xo-collection-state/use-xo-collection-state.ts'
import type { XoMirrorBackup } from '@/types/xo/mirror-backup.type.ts'
import { defineRemoteResource } from '@core/packages/remote-resource/define-remote-resource.ts'

export const useXoMirrorBackupsCollection = defineRemoteResource({
  url: '/rest/v0/backup/jobs/mirror?fields=id,name,mode,type,sourceRemote,remotes',
  initialData: () => [] as XoMirrorBackup[],
  state: (mirrorBackups, context) =>
    useXoCollectionState(mirrorBackups, {
      context,
      baseName: 'mirrorBackup',
    }),
})
