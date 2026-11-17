import { useOperationInProgressLabel } from '@/shared/composables/operation-in-progress-label.composable.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

function mountOperationInProgressLabel() {
  return mountComposable(() => ({
    getOperationInProgressLabel: useOperationInProgressLabel(() => ({ reboot: 'Rebooting' })),
  })).wrapper.vm.getOperationInProgressLabel
}

it('marks the label of a known operation as in progress', () => {
  expect(mountOperationInProgressLabel()('reboot')).toBe(t('operation-in-progress', { operation: 'Rebooting' }))
})

it('returns an empty label for an unknown operation', () => {
  expect(mountOperationInProgressLabel()('unknown_operation')).toBe('')
})

it('returns an empty label when there is no operation', () => {
  expect(mountOperationInProgressLabel()(undefined)).toBe('')
})

it('builds the labels only once an operation is pending', () => {
  const operationLabels = vi.fn(() => ({ reboot: 'Rebooting' }))
  const getOperationInProgressLabel = mountComposable(() => ({
    getOperationInProgressLabel: useOperationInProgressLabel(operationLabels),
  })).wrapper.vm.getOperationInProgressLabel

  getOperationInProgressLabel(undefined)

  expect(operationLabels).not.toHaveBeenCalled()

  getOperationInProgressLabel('reboot')

  expect(operationLabels).toHaveBeenCalledOnce()
})
