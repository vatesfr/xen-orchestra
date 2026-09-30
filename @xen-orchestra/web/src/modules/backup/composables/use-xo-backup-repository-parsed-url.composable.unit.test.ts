import { useXoBackupRepositoryParsedUrl } from '@/modules/backup/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { createBr } from '@/test/create-br.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'
import { parse as parseBackupRepositoryUrl } from 'xo-remote-parser'

function mountParsedUrl(br: FrontXoBackupRepository | undefined) {
  return mountComposable(() => ({ parsedUrl: useXoBackupRepositoryParsedUrl(br) })).wrapper.vm
}

describe('useXoBackupRepositoryParsedUrl', () => {
  it('parses the url of the repository', () => {
    const url = 'nfs://192.168.100.225:/media/nfs?useVhdDirectory=true'

    expect(mountParsedUrl(createBr({ url })).parsedUrl).toEqual(parseBackupRepositoryUrl(url))
  })

  it('returns undefined when there is no repository', () => {
    expect(mountParsedUrl(undefined).parsedUrl).toBeUndefined()
  })

  it('reacts to changes of the source repository', () => {
    const br = ref<FrontXoBackupRepository | undefined>(createBr({ url: 'nfs://192.168.100.225:/media/nfs' }))
    const { wrapper } = mountComposable(() => ({ parsedUrl: useXoBackupRepositoryParsedUrl(br) }))

    br.value = createBr({ url: 's3://key:secret@s3.us-west-1.amazonaws.com/my-bucket/backups' })

    expect(wrapper.vm.parsedUrl?.type).toBe('s3')
  })

  it('accepts a getter as source', () => {
    const br = createBr({ url: 'nfs://192.168.100.225:/media/nfs' })
    const { wrapper } = mountComposable(() => ({ parsedUrl: useXoBackupRepositoryParsedUrl(() => br) }))

    expect(wrapper.vm.parsedUrl).toEqual(parseBackupRepositoryUrl(br.url))
  })
})
