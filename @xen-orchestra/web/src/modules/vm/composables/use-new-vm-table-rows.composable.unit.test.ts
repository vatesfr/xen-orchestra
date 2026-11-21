import { useNewVmTableRows } from '@/modules/vm/composables/use-new-vm-table-rows.composable.ts'
import type { NewVmRowIssue, NewVmRowIssues } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

type Field = 'select' | 'input'

const ERROR_FIELD_ID = 'error-field'

const ITEMS = [{ key: 'first' }, { key: 'second' }, { key: 'third' }]

const issueOn = (field: Field): NewVmRowIssue<Field> => ({ field, message: `Wrong ${field}` })

function mountRows(issues: NewVmRowIssues<Field> = new Map(), warnedKeys = new Set<string>()) {
  const items = ref(ITEMS)

  const { wrapper } = mountComposable(() => ({
    items,
    ...useNewVmTableRows(items, { issues, warnedKeys, warning: undefined, errorFieldId: ERROR_FIELD_ID }, 'select'),
  }))

  return wrapper.vm
}

describe('useNewVmTableRows', () => {
  it('numbers the rows in their order', () => {
    const table = mountRows()

    expect(table.rows.map(row => [row.item.key, row.rank])).toEqual([
      ['first', 1],
      ['second', 2],
      ['third', 3],
    ])
  })

  it('marks the rows with issues as in error and the warned keys as warned about, each on its own', () => {
    const table = mountRows(new Map([['second', [issueOn('input')]]]), new Set(['second', 'third']))

    expect(table.rows.map(row => row.isInError)).toEqual([false, true, false])
    expect(table.rows.map(row => row.isWarned)).toEqual([false, true, true])
  })

  it('gives no id while no row is in error', () => {
    const table = mountRows()

    expect(table.rows.map(row => row.fieldId)).toEqual([undefined, undefined, undefined])
    expect(table.getErrorFieldId('first', 'input')).toBeUndefined()
  })

  it('puts the id on the first row in error when its first issue is on its first field', () => {
    const table = mountRows(
      new Map([
        ['second', [issueOn('select'), issueOn('input')]],
        ['third', [issueOn('select')]],
      ])
    )

    expect(table.rows.map(row => row.fieldId)).toEqual([undefined, ERROR_FIELD_ID, undefined])
    expect(table.getErrorFieldId('second', 'input')).toBeUndefined()
  })

  it('gives the id to the field of the first issue of the first row in error', () => {
    const table = mountRows(
      new Map([
        ['second', [issueOn('input'), issueOn('select')]],
        ['third', [issueOn('input')]],
      ])
    )

    expect(table.rows.map(row => row.fieldId)).toEqual([undefined, undefined, undefined])
    expect(table.getErrorFieldId('second', 'input')).toBe(ERROR_FIELD_ID)
    expect(table.getErrorFieldId('third', 'input')).toBeUndefined()
  })

  it('renumbers the rows and moves the id to the next row in error once the first is removed', () => {
    const table = mountRows(
      new Map([
        ['second', [issueOn('select')]],
        ['third', [issueOn('select')]],
      ])
    )

    table.items = ITEMS.filter(item => item.key !== 'second')

    expect(table.rows.map(row => [row.item.key, row.rank, row.fieldId])).toEqual([
      ['first', 1, undefined],
      ['third', 2, ERROR_FIELD_ID],
    ])
  })
})
