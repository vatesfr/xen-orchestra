import {
  addFilterClause,
  countFilterPropertyClauses,
  getFilterPropertyClauses,
  getFilterPropertyValues,
  isFilterParsable,
  removeFilterProperty,
  setFilterProperty,
} from '@/shared/utils/query-builder-filter.util.ts'
import { UNPARSABLE_FILTER } from '@/test/query-builder-filters.ts'
import { parse } from 'complex-matcher'

const FILTERS_WITHOUT_TOP_LEVEL_LABEL_CLAUSE = [
  ['a clause nested in a group', '|(label:/^alpha$/ age:42)'],
  ['a filter without clause of the property', 'age:42'],
  ['an empty filter', ''],
  ['an unparsable filter', UNPARSABLE_FILTER],
]

const LABEL_CLAUSE_FORMS = ['label:/^alpha$/', '!label:/^alpha$/', 'label?', '!label?']

// What removing the label clauses does to a filter, whichever function removes them
const LABEL_REMOVAL_CASES = [
  ['removes the clause of the property and keeps the others', 'age:42 label:/^alpha$/', 'age:42'],
  ['removes every clause of the property', 'label:/^alpha$/ age:42 label:/^beta$/', 'age:42'],
  ['empties a filter whose last clause is removed', 'label:/^alpha$/', ''],
  ['keeps an empty filter empty', '', ''],
  ['leaves an unparsable filter unchanged', UNPARSABLE_FILTER, UNPARSABLE_FILTER],
]

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

  it.each(FILTERS_WITHOUT_TOP_LEVEL_LABEL_CLAUSE)('reads nothing from %s', (_, filter) => {
    expect(getFilterPropertyValues(filter, 'label')).toEqual([])
  })
})

describe('getFilterPropertyClauses', () => {
  it.each(LABEL_CLAUSE_FORMS)('reads the %s clause', clause => {
    expect(getFilterPropertyClauses(`age:42 ${clause}`, 'label')).toEqual([clause])
  })

  it('reads every clause of the property in the filter order', () => {
    expect(getFilterPropertyClauses('label:/^alpha$/ age:42 !label?', 'label')).toEqual(['label:/^alpha$/', '!label?'])
  })

  it.each(FILTERS_WITHOUT_TOP_LEVEL_LABEL_CLAUSE)('reads nothing from %s', (_, filter) => {
    expect(getFilterPropertyClauses(filter, 'label')).toEqual([])
  })
})

describe('countFilterPropertyClauses', () => {
  it('counts the top-level clauses of the property, whatever their form', () => {
    expect(countFilterPropertyClauses(`age:42 ${LABEL_CLAUSE_FORMS.join(' ')}`, 'label')).toBe(4)
  })

  it.each([
    ['an alternative', '|(label:/^alpha$/ age:42)'],
    ['a negated group', '!(label? age:42)'],
    ['a group nested in an alternative', '|(age:42 (label? size:1))'],
  ])('counts a clause nested in %s', (_, filter) => {
    expect(countFilterPropertyClauses(filter, 'label')).toBe(1)
  })

  it.each([
    ['a filter without clause of the property', 'age:42 |(size:1 !age?)'],
    ['the alternative values of another property', 'age:|(1 2)'],
    ['an empty filter', ''],
    ['an unparsable filter', UNPARSABLE_FILTER],
  ])('counts nothing in %s', (_, filter) => {
    expect(countFilterPropertyClauses(filter, 'label')).toBe(0)
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

  it('replaces every clause of the property with a single one', () => {
    expect(setFilterProperty('label:/^alpha$/ age:42 label:/^beta$/', 'label', 'gamma')).toBe('age:42 label:/^gamma$/')
  })

  it('keeps the negated and presence clauses of the property', () => {
    expect(setFilterProperty('!label:/^alpha$/ label?', 'label', 'beta')).toBe('!label:/^alpha$/ label? label:/^beta$/')
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

  it.each(LABEL_REMOVAL_CASES)('%s without value', (_, filter, expectedFilter) => {
    expect(setFilterProperty(filter, 'label', undefined)).toBe(expectedFilter)
  })
})

describe('isFilterParsable', () => {
  it.each([
    ['a filter of clauses', 'label:/^alpha$/ age:42'],
    ['an empty filter', ''],
  ])('accepts %s', (_, filter) => {
    expect(isFilterParsable(filter)).toBe(true)
  })

  it('rejects an unparsable filter', () => {
    expect(isFilterParsable(UNPARSABLE_FILTER)).toBe(false)
  })
})

describe('removeFilterProperty', () => {
  it.each(LABEL_CLAUSE_FORMS)('removes the %s clause and keeps the others', clause => {
    expect(removeFilterProperty(`age:42 ${clause} size:1`, 'label')).toBe('age:42 size:1')
  })

  it('keeps a clause nested in a group', () => {
    expect(removeFilterProperty('|(label:/^alpha$/ age:42) label?', 'label')).toBe('|(label:/^alpha$/ age:42)')
  })

  it.each(LABEL_REMOVAL_CASES)('%s', (_, filter, expectedFilter) => {
    expect(removeFilterProperty(filter, 'label')).toBe(expectedFilter)
  })
})

describe('addFilterClause', () => {
  it('appends the clause to the others', () => {
    expect(addFilterClause('age:42', 'label:/^alpha$/')).toBe('age:42 label:/^alpha$/')
  })

  it('sets the clause of an empty filter', () => {
    expect(addFilterClause('', '!label?')).toBe('!label?')
  })

  it('appends each clause of an expression of several clauses', () => {
    expect(addFilterClause('age:42', 'label? size:1')).toBe('age:42 label? size:1')
  })

  it('appends the clause after a group', () => {
    expect(addFilterClause('|(age:42 size:1)', 'label?')).toBe('|(age:42 size:1) label?')
  })

  it('leaves the filter unchanged with an empty clause', () => {
    expect(addFilterClause('age:42', '')).toBe('age:42')
  })

  it.each([
    ['an unparsable filter', UNPARSABLE_FILTER, 'label?'],
    ['an unparsable clause', 'age:42', UNPARSABLE_FILTER],
  ])('leaves %s unchanged', (_, filter, clause) => {
    expect(addFilterClause(filter, clause)).toBe(filter)
  })
})
