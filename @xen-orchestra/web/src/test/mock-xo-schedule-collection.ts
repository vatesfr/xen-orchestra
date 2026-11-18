import type {
  FrontXoSchedule,
  useXoScheduleCollection as realUseXoScheduleCollection,
} from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createMockCollection } from '@/test/find-by-id.ts'
import { groupBy } from '@/test/group-by.ts'
import { computed, ref } from 'vue'

// Shared state of the mocked schedule collection: a test sets the schedules it needs, reset it in `beforeEach`
export const scheduleCollectionMock = {
  schedules: ref<FrontXoSchedule[]>([]),
  reset() {
    this.schedules.value = []
  },
}

// Use as `mockModule(import('@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'), () => import('@/test/mock-xo-schedule-collection.ts'))`.
// As in the real collection, `schedulesByJobId` groups the schedules by their `jobId`
export const useXoScheduleCollection = (() => ({
  ...createMockCollection('Schedule', 'Schedules', scheduleCollectionMock.schedules),
  schedulesByJobId: computed(() => groupBy(scheduleCollectionMock.schedules.value, schedule => schedule.jobId)),
})) as unknown as typeof realUseXoScheduleCollection
