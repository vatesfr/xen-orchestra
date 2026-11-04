import NewBackupJobDrawer from '@/modules/backup-job/components/drawer/NewBackupJobDrawer.vue'
import BackupJobPlanningStep from '@/modules/backup-job/components/form/steps/BackupJobPlanningStep.vue'
import BackupJobReviewStep from '@/modules/backup-job/components/form/steps/BackupJobReviewStep.vue'
import BackupJobSourceStep from '@/modules/backup-job/components/form/steps/BackupJobSourceStep.vue'
import BackupJobTargetStep from '@/modules/backup-job/components/form/steps/BackupJobTargetStep.vue'
import BackupJobTransferStep from '@/modules/backup-job/components/form/steps/BackupJobTransferStep.vue'
import type { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import type { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { useXoVmBackupArchiveCollection } from '@/modules/vm/remote-resources/use-xo-vm-backup-archive-collection.ts'
import type { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { cancelDrawer, findDrawerButtonLabels, submitDrawer } from '@/test/drawer.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { computed, ref } from 'vue'

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

const STEPS = {
  source: BackupJobSourceStep,
  transfer: BackupJobTransferStep,
  target: BackupJobTargetStep,
  planning: BackupJobPlanningStep,
  review: BackupJobReviewStep,
}

async function mountDrawer() {
  const wrapper = mount(NewBackupJobDrawer, { global: createGlobalTestConfig(), attachTo: document.body })
  await flushPromises()

  return wrapper
}

function findRenderedSteps(wrapper: VueWrapper) {
  return (Object.keys(STEPS) as (keyof typeof STEPS)[]).filter(step => wrapper.findComponent(STEPS[step]).exists())
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

async function fill(wrapper: VueWrapper, label: string, value: string) {
  await getField(wrapper, label).get('input').setValue(value)
}

async function selectRadio(wrapper: VueWrapper, label: string) {
  const radio = wrapper.findAll('.ui-radio-button').find(radio => radio.text() === label)

  if (radio === undefined) {
    throw new Error(`No radio "${label}"`)
  }

  await radio.get('input').setValue()
  await flushPromises()
}

async function mountDrawerAtTransferStep() {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), 'Daily backup')
  await submitDrawer(wrapper)

  return wrapper
}

async function mountMetadataDrawerAtTargetStep() {
  const wrapper = await mountDrawer()
  await fill(wrapper, t('name'), 'Metadata backup')
  await selectRadio(wrapper, t('pool-metadata-and-xo-config'))
  await submitDrawer(wrapper)

  return wrapper
}

async function mountMetadataDrawerAtReviewStep() {
  const wrapper = await mountMetadataDrawerAtTargetStep()
  await fill(wrapper, t('minimum-backups-to-retain'), '3')
  await submitDrawer(wrapper)
  await submitDrawer(wrapper)

  return wrapper
}

describe('source step', () => {
  it('is the first step, offering to cancel or to continue', async () => {
    const wrapper = await mountDrawer()

    expect(findRenderedSteps(wrapper)).toEqual(['source'])
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('cancel'), t('action:continue')])
  })

  it('stays on the step when it is submitted while invalid', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(findRenderedSteps(wrapper)).toEqual(['source'])
  })

  it('cancels from the cancel button', async () => {
    const wrapper = await mountDrawer()

    await cancelDrawer(wrapper)

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })
})

describe('transfer step', () => {
  it('follows a valid source step, offering to go back or to continue', async () => {
    const wrapper = await mountDrawerAtTransferStep()

    expect(findRenderedSteps(wrapper)).toEqual(['transfer'])
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('action:back'), t('action:continue')])
  })

  it('goes back to the source step, without cancelling', async () => {
    const wrapper = await mountDrawerAtTransferStep()

    await getButton(wrapper, t('action:back')).trigger('click')
    await flushPromises()

    expect(findRenderedSteps(wrapper)).toEqual(['source'])
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})

describe('metadata backup', () => {
  it('goes from the source step to the target step', async () => {
    const wrapper = await mountMetadataDrawerAtTargetStep()

    expect(findRenderedSteps(wrapper)).toEqual(['target'])
  })

  it('reaches the review, offering to create the job', async () => {
    const wrapper = await mountMetadataDrawerAtReviewStep()

    expect(findRenderedSteps(wrapper)).toEqual(['review'])
    expect(findDrawerButtonLabels(wrapper)).toEqual([t('action:back'), t('action:create')])
  })

  it('confirms the payload of the job once the review is submitted', async () => {
    const wrapper = await mountMetadataDrawerAtReviewStep()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [expect.objectContaining({ type: 'metadataBackup', name: 'Metadata backup' })],
    ])
  })

  it('goes back to the edited step from the review', async () => {
    const wrapper = await mountMetadataDrawerAtReviewStep()

    await wrapper.getComponent(BackupJobReviewStep).vm.$emit('edit', 'target')
    await flushPromises()

    expect(findRenderedSteps(wrapper)).toEqual(['target'])
  })
})
