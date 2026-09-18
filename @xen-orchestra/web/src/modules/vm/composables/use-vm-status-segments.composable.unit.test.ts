import { useVmStatusSegments, type VmStatusCounts } from '@/modules/vm/composables/use-vm-status-segments.composable.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountSegments(counts?: VmStatusCounts) {
  const { wrapper } = mountComposable(() => ({ segments: useVmStatusSegments(counts) }))

  return wrapper.vm.segments
}

it('lays out the four VM statuses in the order a donut reads them, each with its accent', () => {
  expect(mountSegments({ running: 7, paused: 4, suspended: 2, halted: 5 })).toEqual([
    { label: t('vm:status:running', 2), value: 7, accent: 'success' },
    { label: t('vm:status:paused', 2), value: 4, accent: 'info' },
    { label: t('vm:status:suspended', 2), value: 2, accent: 'neutral' },
    { label: t('vm:status:halted', 2), value: 5, accent: 'danger' },
  ])
})

it('counts a status the caller does not report as zero', () => {
  expect(mountSegments({ running: 7 }).map(segment => segment.value)).toEqual([7, 0, 0, 0])
})

it('counts every status as zero when there is nothing to report yet', () => {
  expect(mountSegments().map(segment => segment.value)).toEqual([0, 0, 0, 0])
})
