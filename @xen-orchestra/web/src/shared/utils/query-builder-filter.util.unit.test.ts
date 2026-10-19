import { getFilterPropertyValues, setFilterProperty } from '@/shared/utils/query-builder-filter.util.ts'
import { parse } from 'complex-matcher'

const UNPARSABLE_FILTER = 'label:('

describe('getFilterPropertyValues', () => {
  it('reads the value of an exact match clause', () => {
    expect(getFilterPropertyValues('label:/^alpha$/', 'label')).toEqual(['alpha'])
  })

  it('reads the values of every clause of the property and their alternatives', () => {
    expect(getFilterPropertyValues('label:/^alpha$/ age:42 label:|(/^beta$/ "gamma")', 'label')).toEqual([
      'alpha',
      'beta',
      'gamma',
    ])
  })

  it.each([
    ['a clause nested in a group', '|(label:/^alpha$/ age:42)'],
    ['a filter without clause of the property', 'age:42'],
    ['an empty filter', ''],
    ['an unparsable filter', UNPARSABLE_FILTER],
  ])('reads nothing from %s', (_, filter) => {
    expect(getFilterPropertyValues(filter, 'label')).toEqual([])
  })
})

describe('setFilterProperty', () => {
  it('sets an exact match clause on an empty filter', () => {
    expect(setFilterProperty('', 'label', 'alpha')).toBe('label:/^alpha$/')
  })

  it('replaces the clause of the property', () => {
    expect(setFilterProperty('label:/^alpha$/', 'label', 'beta')).toBe('label:/^beta$/')
  })

  it('keeps the clauses of the other properties', () => {
    expect(setFilterProperty('age:42 label:/^alpha$/', 'label', 'beta')).toBe('age:42 label:/^beta$/')
  })

  // The lookalike would match if the regular expression characters were left unescaped
  it.each([
    ['alpha.beta (1)', 'alphaxbeta 1'],
    ['42', '142'],
  ])('matches %s exactly', (value, lookalike) => {
    const filter = setFilterProperty('', 'label', value)
    const predicate = parse(filter).createPredicate()
    const labels = [value, `${value}x`, `x${value}`, lookalike]

    expect(getFilterPropertyValues(filter, 'label')).toEqual([value])
    expect(labels.map(label => predicate({ label }))).toEqual([true, false, false, false])
  })

  it('removes the clause of the property and keeps the others', () => {
    expect(setFilterProperty('age:42 label:/^alpha$/', 'label', undefined)).toBe('age:42')
  })

  it('empties a filter whose last clause is removed', () => {
    expect(setFilterProperty('label:/^alpha$/', 'label', undefined)).toBe('')
  })

  it('keeps an empty filter empty when removing a clause', () => {
    expect(setFilterProperty('', 'label', undefined)).toBe('')
  })

  it('leaves an unparsable filter unchanged', () => {
    expect(setFilterProperty(UNPARSABLE_FILTER, 'label', 'alpha')).toBe(UNPARSABLE_FILTER)
  })
})
