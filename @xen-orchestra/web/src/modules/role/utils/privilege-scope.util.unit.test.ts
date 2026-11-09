import {
  buildManualSelectionSelector,
  getAvailablePrivilegeScopeTypes,
  getPrivilegeScopeType,
  parseManualSelectionSelector,
} from '@/modules/role/utils/privilege-scope.util.ts'

describe('buildManualSelectionSelector', () => {
  it('matches the selected objects by id', () => {
    expect(buildManualSelectionSelector(['vm-1', 'vm-2'])).toBe('id:|(vm-1 vm-2)')
  })

  it('quotes the ids complex-matcher could not read as a single value', () => {
    expect(buildManualSelectionSelector(['OpaqueRef:abc', 'with space'])).toBe('id:|("OpaqueRef:abc" "with space")')
  })
})

describe('parseManualSelectionSelector', () => {
  it('returns the ids of a selector built from a manual selection', () => {
    const ids = ['vm-1', 'OpaqueRef:abc', 'with space']

    expect(parseManualSelectionSelector(buildManualSelectionSelector(ids))).toEqual(ids)
  })

  it('reads a single-id selector as a manual selection', () => {
    expect(parseManualSelectionSelector(buildManualSelectionSelector(['vm-1']))).toEqual(['vm-1'])
  })

  it('returns undefined for a selector on another property', () => {
    expect(parseManualSelectionSelector('name_label:|(vm-1 vm-2)')).toBeUndefined()
  })

  it('returns undefined for a selector combining several clauses', () => {
    expect(parseManualSelectionSelector('id:vm-1 power_state:running')).toBeUndefined()
  })

  it('returns undefined for an id pattern that is not a plain value', () => {
    expect(parseManualSelectionSelector('id:vm-*')).toBeUndefined()
  })

  it('returns undefined for an unparsable selector', () => {
    expect(parseManualSelectionSelector('id:|(vm-1')).toBeUndefined()
  })
})

describe('getAvailablePrivilegeScopeTypes', () => {
  it('offers every scope type for a resource whose objects can be listed', () => {
    expect(getAvailablePrivilegeScopeTypes('vm')).toEqual(['all-objects', 'manual-selection', 'dynamic-selection'])
  })

  it('offers only the dynamic selection on top of all objects for a resource without manual selection', () => {
    expect(getAvailablePrivilegeScopeTypes('acl-privilege')).toEqual(['all-objects', 'dynamic-selection'])
  })

  it('offers only all objects for a resource whose objects cannot be listed', () => {
    expect(getAvailablePrivilegeScopeTypes('vtpm')).toEqual(['all-objects'])
  })
})

describe('getPrivilegeScopeType', () => {
  it('reads a privilege without selector as applying to all objects', () => {
    expect(getPrivilegeScopeType('vm', undefined)).toBe('all-objects')
  })

  it('reads an id selector as a manual selection', () => {
    expect(getPrivilegeScopeType('vm', buildManualSelectionSelector(['vm-1', 'vm-2']))).toBe('manual-selection')
  })

  it('reads any other selector as a dynamic selection', () => {
    expect(getPrivilegeScopeType('vm', 'power_state:running')).toBe('dynamic-selection')
  })

  it('reads an id selector as a dynamic selection for a resource without manual selection', () => {
    expect(getPrivilegeScopeType('pif', 'id:abc')).toBe('dynamic-selection')
  })
})
