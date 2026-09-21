import PoolSystemStorageConfiguration from '@/modules/pool/components/system/PoolSystemStorageConfiguration.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoSr,
  useXoSrCollection,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { findTitleText } from '@/test/find-card-heading.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { hasStateHero } from '@/test/find-state-hero.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

const { useXoSrCollectionMock } = vi.hoisted(() => ({
  useXoSrCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'), () => ({
  useXoSrCollection: useXoSrCollectionMock as unknown as typeof useXoSrCollection,
}))

const srsById = new Map<FrontXoSr['id'], FrontXoSr>()

function givenSrs(srs: FrontXoSr[]) {
  srs.forEach(sr => srsById.set(sr.id, sr))
}

function createSrWith(id: string, nameLabel: string) {
  return createSr({ id: id as FrontXoSr['id'], name_label: nameLabel })
}

beforeEach(() => {
  srsById.clear()
  useXoSrCollectionMock.mockReset()

  useXoSrCollectionMock.mockReturnValue({
    areSrsReady: ref(true),
    useGetSrById: (id: MaybeRefOrGetter<FrontXoSr['id'] | undefined>) =>
      computed(() => {
        const srId = toValue(id)

        return srId === undefined ? undefined : srsById.get(srId)
      }),
    useGetSrsByIds: (ids: MaybeRefOrGetter<FrontXoSr['id'][]>) =>
      computed(() => toValue(ids).flatMap(srId => srsById.get(srId) ?? [])),
  })
})

function mountStorageConfiguration(pool: FrontXoPool) {
  return mount(PoolSystemStorageConfiguration, {
    props: { pool },
    global: createGlobalTestConfig(),
  })
}

function createPoolWithoutSrs() {
  return createPool({ default_SR: undefined, suspendSr: undefined, crashDumpSr: undefined, haSrs: [] })
}

it('renders the card title', () => {
  const wrapper = mountStorageConfiguration(createPoolWithoutSrs())

  expect(findTitleText(wrapper)).toBe(t('storage-configuration'))
})

it('shows a busy state instead of the rows while the storage repositories are loading', () => {
  useXoSrCollectionMock.mockReturnValue({
    areSrsReady: ref(false),
    useGetSrById: () => computed(() => undefined),
    useGetSrsByIds: () => computed(() => []),
  })

  const wrapper = mountStorageConfiguration(createPoolWithoutSrs())

  expect(hasStateHero(wrapper)).toBe(true)
  expect(findLabelledValues(wrapper)).toEqual({})
})

it('names the storage repository the pool configured for each purpose', () => {
  givenSrs([
    createSrWith('sr-default', 'Default SR'),
    createSrWith('sr-suspend', 'Suspend SR'),
    createSrWith('sr-crash', 'Crash Dump SR'),
    createSrWith('sr-ha', 'Heartbeat SR'),
  ])

  const pool = createPool({
    default_SR: 'sr-default' as FrontXoPool['default_SR'],
    suspendSr: 'sr-suspend' as FrontXoPool['suspendSr'],
    crashDumpSr: 'sr-crash' as FrontXoPool['crashDumpSr'],
    haSrs: ['sr-ha'] as FrontXoPool['haSrs'],
  })

  expect(findLabelledValues(mountStorageConfiguration(pool))).toEqual({
    [t('default-storage-repository')]: 'Default SR',
    [t('suspend-storage-repository')]: 'Suspend SR',
    [t('crash-dump-storage-repository')]: 'Crash Dump SR',
    [t('heartbeat-storage-repository')]: 'Heartbeat SR',
  })
})

it('falls back to "None" for every purpose the pool configured no storage repository for', () => {
  expect(findLabelledValues(mountStorageConfiguration(createPoolWithoutSrs()))).toEqual({
    [t('default-storage-repository')]: t('none'),
    [t('suspend-storage-repository')]: t('none'),
    [t('crash-dump-storage-repository')]: t('none'),
    [t('heartbeat-storage-repository')]: t('none'),
  })
})

it('falls back to "None" when a configured storage repository no longer exists', () => {
  const pool = createPool({ default_SR: 'sr-gone' as FrontXoPool['default_SR'] })

  expect(findLabelledValues(mountStorageConfiguration(pool))).toMatchObject({
    [t('default-storage-repository')]: t('none'),
  })
})

it('lists every heartbeat storage repository of the pool', () => {
  givenSrs([createSrWith('sr-ha-1', 'Heartbeat SR 1'), createSrWith('sr-ha-2', 'Heartbeat SR 2')])

  const pool = createPool({ haSrs: ['sr-ha-1', 'sr-ha-2'] as FrontXoPool['haSrs'] })
  const heartbeatSrs = mountStorageConfiguration(pool).findAll('.vts-tabular-key-value-row li')

  expect(heartbeatSrs.map(sr => sr.text())).toEqual(['Heartbeat SR 1', 'Heartbeat SR 2'])
})

it('falls back to "None" when the pool has no heartbeat storage repository', () => {
  const pool = createPool({ haSrs: [] })

  expect(findLabelledValues(mountStorageConfiguration(pool))).toMatchObject({
    [t('heartbeat-storage-repository')]: t('none'),
  })
})
