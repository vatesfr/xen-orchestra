import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'

const ITEMS = [
  { name: 'alpha', tags: ['prod'] },
  { name: 'beta', tags: ['dev'] },
  { name: 'gamma', tags: ['prod'] },
]

describe('filterByQuery', () => {
  it('matches nothing without query', () => {
    expect(filterByQuery(ITEMS, '')).toEqual([])
  })

  it('matches nothing with a blank query', () => {
    expect(filterByQuery(ITEMS, '   ')).toEqual([])
  })

  it('keeps the items matching the query', () => {
    expect(filterByQuery(ITEMS, 'tags:prod')).toEqual([ITEMS[0], ITEMS[2]])
  })

  it('matches nothing with an invalid query', () => {
    expect(filterByQuery(ITEMS, 'name:(')).toEqual([])
  })

  it('evaluates the query on the context of each item and keeps the items', () => {
    expect(filterByQuery(ITEMS, 'item:(tags:prod)', item => ({ item }))).toEqual([ITEMS[0], ITEMS[2]])
  })
})
