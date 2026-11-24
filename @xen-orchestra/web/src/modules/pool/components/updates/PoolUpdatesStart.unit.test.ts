import PoolUpdatesStart from '@/modules/pool/components/updates/PoolUpdatesStart.vue'
import type { useXoPoolMissingPatchesCollection } from '@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'
import type { useXoPoolRollingUpdatePrecheck } from '@/modules/pool/remote-resources/use-xo-pool-rolling-update-precheck.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoRoutes } from '@/test/mock-xo-routes.ts'
import { mockXoScheduleCollection, scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { PoolRollingUpdatePrecheck } from '@vates/types'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const SCHEDULE_ID = 'schedule-42' as FrontXoSchedule['id']

const checks = ref<PoolRollingUpdatePrecheck[]>([])

mockXoRoutes()

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-missing-patches-collection.ts'), () => ({
  useXoPoolMissingPatchesCollection: (() => ({
    poolMissingPatches: ref([]),
    arePoolMissingPatchesReady: ref(true),
    hasPoolMissingPatchesError: ref(false),
  })) as unknown as typeof useXoPoolMissingPatchesCollection,
}))

mockModule(import('@/modules/pool/remote-resources/use-xo-pool-rolling-update-precheck.ts'), () => ({
  useXoPoolRollingUpdatePrecheck: (() => ({
    checks,
    isPrecheckReady: ref(true),
    hasPrecheckError: ref(false),
  })) as unknown as typeof useXoPoolRollingUpdatePrecheck,
}))

mockXoScheduleCollection()

mockXoVmCollection()

mockXoCollections('host')

beforeEach(() => {
  scheduleCollectionMock.reset()
  vmCollectionMock.reset()
  xoCollectionsMock.reset()

  checks.value = [{ id: 'pausedSchedules', result: 'info', objects: [{ type: 'schedule', id: SCHEDULE_ID }] }]
})

function mountObjects() {
  return mount(PoolUpdatesStart, {
    props: { pool: createPool(), isStarting: false },
    global: createGlobalTestConfig(),
  }).find('.objects')
}

describe('schedule of a check', () => {
  it('is named, not shown by its id', () => {
    scheduleCollectionMock.schedules.value = [createSchedule({ id: SCHEDULE_ID, name: 'Nightly' })]

    const objects = mountObjects()

    expect(objects.text()).toBe('Nightly')
  })

  it('links to the backup overview of XO 5', () => {
    scheduleCollectionMock.schedules.value = [createSchedule({ id: SCHEDULE_ID })]

    expect(mountObjects().findComponent(UiLink).attributes('href')).toBe('https://xo5.example.com/#/backup/overview')
  })

  it('is untitled when it has no name', () => {
    scheduleCollectionMock.schedules.value = [createSchedule({ id: SCHEDULE_ID, name: '' })]

    expect(mountObjects().text()).toBe(t('untitled'))
  })

  it('falls back to its id, without link, when the schedule is unknown', () => {
    const objects = mountObjects()

    expect(objects.text()).toBe(SCHEDULE_ID)
    expect(objects.findComponent(UiLink).exists()).toBe(false)
  })
})
