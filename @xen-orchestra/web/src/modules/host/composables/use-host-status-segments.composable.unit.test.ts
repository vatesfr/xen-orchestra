import {
  useHostStatusSegments,
  type HostStatusCounts,
} from '@/modules/host/composables/use-host-status-segments.composable.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountSegments(counts?: HostStatusCounts) {
  const { wrapper } = mountComposable(() => ({ segments: useHostStatusSegments(counts) }))

  return wrapper.vm.segments
}

it('lays out the three host statuses in the order a donut reads them, each with its accent', () => {
  expect(mountSegments({ running: 6, disabled: 2, halted: 3 })).toEqual([
    { label: t('host:status:running', 2), value: 6, accent: 'success' },
    { label: t('host:status:disabled', 2), value: 2, accent: 'muted' },
    { label: t('host:status:halted', 2), value: 3, accent: 'danger' },
  ])
})

it('counts a status the caller does not report as zero', () => {
  expect(mountSegments({ running: 6 }).map(segment => segment.value)).toEqual([6, 0, 0])
})

it('counts every status as zero when there is nothing to report yet', () => {
  expect(mountSegments().map(segment => segment.value)).toEqual([0, 0, 0])
})
