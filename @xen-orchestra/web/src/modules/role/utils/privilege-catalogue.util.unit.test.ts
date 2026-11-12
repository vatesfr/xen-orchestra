import {
  getResourceActions,
  isActionCovered,
  removeCoveredActions,
} from '@/modules/role/utils/privilege-catalogue.util.ts'

describe('getResourceActions', () => {
  it('has no action without a resource', () => {
    expect(getResourceActions(undefined)).toEqual([])
  })

  it('starts with the wildcard', () => {
    expect(getResourceActions('vm')[0]).toBe('*')
  })

  it('lists the actions of the resource', () => {
    expect(getResourceActions('vm')).toEqual(expect.arrayContaining(['read', 'start', 'delete']))
  })

  it('lists each sub-action right after its parent action', () => {
    const poolActions = getResourceActions('pool')

    const createIndex = poolActions.indexOf('create')

    expect(poolActions.slice(createIndex, createIndex + 3)).toEqual(['create', 'create:network', 'create:vm'])
  })

  it('lists each action once', () => {
    const vmActions = getResourceActions('vm')

    expect(new Set(vmActions).size).toBe(vmActions.length)
  })
})

describe('isActionCovered', () => {
  it('is covered by the wildcard', () => {
    expect(isActionCovered('read', ['*'])).toBe(true)
    expect(isActionCovered('create:vm', ['*'])).toBe(true)
  })

  it('is covered by its parent action', () => {
    expect(isActionCovered('create:vm', ['create'])).toBe(true)
  })

  it('is not covered by itself', () => {
    expect(isActionCovered('*', ['*'])).toBe(false)
    expect(isActionCovered('create', ['create'])).toBe(false)
  })

  it('is not covered by one of its sub-actions', () => {
    expect(isActionCovered('create', ['create:vm'])).toBe(false)
  })

  it('is not covered by a sibling action', () => {
    expect(isActionCovered('create:vm', ['create:network'])).toBe(false)
  })

  it('is not covered when nothing is selected', () => {
    expect(isActionCovered('read', [])).toBe(false)
  })
})

describe('removeCoveredActions', () => {
  it('keeps only the wildcard when it is selected', () => {
    expect(removeCoveredActions(['*', 'read', 'create', 'create:vm'])).toEqual(['*'])
  })

  it('removes the sub-actions of a selected action', () => {
    expect(removeCoveredActions(['create', 'create:network', 'create:vm', 'read'])).toEqual(['create', 'read'])
  })

  it('keeps the actions that no other one covers', () => {
    expect(removeCoveredActions(['create:vm', 'read', 'update:tags'])).toEqual(['create:vm', 'read', 'update:tags'])
  })
})
