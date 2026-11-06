import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import { useNewBackupJobForm } from '@/modules/backup-job/form/new/use-new-backup-job-form.ts'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, defineComponent, h, ref } from 'vue'

vi.mock(import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'), () => ({
  useXoProxyCollection: (() => ({
    proxies: ref([]),
    useGetProxyById: () => computed(() => undefined),
  })) as unknown as typeof useXoProxyCollection,
}))

vi.mock(import('@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'), () => ({
  useXoBackupRepositoryCollection: (() => ({
    backupRepositories: ref([]),
    areBackupRepositoriesReady: ref(true),
    useGetBackupRepositoryById: () => computed(() => undefined),
  })) as unknown as typeof useXoBackupRepositoryCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({
    vms: ref([]),
    areVmsReady: ref(true),
    getVmById: () => undefined,
  })) as unknown as typeof useXoVmCollection,
}))

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => ({
    pools: ref([]),
    arePoolsReady: ref(true),
    getPoolById: () => undefined,
  })) as unknown as typeof useXoPoolCollection,
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: (() => ({
    srs: ref([]),
    areSrsReady: ref(true),
    getSrById: () => undefined,
  })) as unknown as typeof useXoSrCollection,
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds: () => [] })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById: () => undefined })) as unknown as typeof useXoVdiCollection,
}))

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'), () => ({
  useXoVmBackupArchiveCollection: (() => ({
    backupArchives: ref([]),
    areBackupArchivesReady: ref(true),
  })) as unknown as typeof useXoVmBackupArchiveCollection,
}))

async function mountReviewStep({ isMetadata = false } = {}) {
  const wrapper = mount(
    defineComponent({
      emits: ['edit'],
      setup(_, { emit }) {
        const { source, transfer, target, planning } = useNewBackupJobForm()

        if (isMetadata) {
          source.formData.dataSource = 'metadata'
        }

        return () =>
          h(BackupJobReviewStep, {
            source,
            transfer: source.isMetadata.value ? undefined : transfer,
            target,
            planning,
            onEdit: (step: string) => emit('edit', step),
          })
      },
    }),
    { global: createGlobalTestConfig() }
  )

  await flushPromises()

  return wrapper
}

function findSectionTitles(wrapper: VueWrapper) {
  return wrapper.findAllComponents(BackupJobReviewSection).map(section => section.props('title'))
}

it('reviews the source, the transfer, the target and the planning', async () => {
  const wrapper = await mountReviewStep()

  expect(findSectionTitles(wrapper)).toEqual([t('source'), t('transfer'), t('target'), t('planning')])
})

it('reviews no transfer for a metadata backup', async () => {
  const wrapper = await mountReviewStep({ isMetadata: true })

  expect(findSectionTitles(wrapper)).toEqual([t('source'), t('target'), t('planning')])
})

it.each(['source', 'transfer', 'target', 'planning'])('goes back to the %s step to edit it', async step => {
  const wrapper = await mountReviewStep()

  const section = wrapper.findAllComponents(BackupJobReviewSection).find(section => section.props('title') === t(step))

  await section!.get('button').trigger('click')

  expect(wrapper.emitted('edit')).toEqual([[step]])
})
