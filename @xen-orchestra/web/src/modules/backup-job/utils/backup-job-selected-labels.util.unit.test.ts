import { formatSelectedLabels } from '@/modules/backup-job/utils/backup-job-selected-labels.util.ts'

const WEEK_DAY_OPTIONS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
]

describe('formatSelectedLabels', () => {
  it('has no label when nothing is selected', () => {
    expect(formatSelectedLabels(WEEK_DAY_OPTIONS, [])).toBeUndefined()
  })

  it('lists the labels of the selected values in the order of the options', () => {
    expect(formatSelectedLabels(WEEK_DAY_OPTIONS, [3, 1])).toBe('Mon, Wed')
  })

  it('ignores a selected value without option', () => {
    expect(formatSelectedLabels(WEEK_DAY_OPTIONS, [2, 7])).toBe('Tue')
  })
})
