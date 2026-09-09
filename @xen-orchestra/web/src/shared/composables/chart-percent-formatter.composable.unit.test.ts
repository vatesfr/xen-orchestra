import { useChartPercentFormatter } from '@/shared/composables/chart-percent-formatter.composable.ts'
import { n } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const mountFormatter = () => mountComposable(() => ({ format: useChartPercentFormatter() })).wrapper.vm.format

it('returns an empty string for a null value', () => {
  expect(mountFormatter()(null)).toBe('')
})

it('formats a hundredth-of-a-percent value as a percentage', () => {
  expect(mountFormatter()(4200)).toBe(n(42, 'percent'))
})
