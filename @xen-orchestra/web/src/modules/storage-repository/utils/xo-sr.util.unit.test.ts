import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getSrCustomFields, getSrPageLocation, isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createSr } from '@/test/create-sr.ts'
import { SR_SCOPE_TYPE } from '@core/types/storage-repository.type.ts'

describe('isSrWritable', () => {
  it('accepts a user SR with some space', () => {
    expect(isSrWritable(createSr({ content_type: 'user', size: ONE_GB }))).toBe(true)
  })

  it('rejects an ISO SR', () => {
    expect(isSrWritable(createSr({ content_type: 'iso' }))).toBe(false)
  })

  it('rejects an SR with no space at all', () => {
    expect(isSrWritable(createSr({ size: 0 }))).toBe(false)
  })
})

describe('getSrPageLocation', () => {
  it('points at the page of the SR, remembering it was opened from a pool', () => {
    expect(getSrPageLocation(createSr({ id: 'sr-42' as FrontXoSr['id'] }), { type: SR_SCOPE_TYPE.POOL })).toEqual({
      name: '/sr/[id]',
      params: { id: 'sr-42' },
      query: { from: 'pool' },
    })
  })

  it('remembers which host the SR was opened from', () => {
    expect(
      getSrPageLocation(createSr({ id: 'sr-42' as FrontXoSr['id'] }), { type: SR_SCOPE_TYPE.HOST, hostId: 'host-7' })
    ).toEqual({
      name: '/sr/[id]',
      params: { id: 'sr-42' },
      query: { from: 'host', host: 'host-7' },
    })
  })
})

describe('getSrCustomFields', () => {
  it('reads the custom fields of the SR, without their XenCenter prefix', () => {
    const sr = createSr({
      other_config: {
        'XenCenter.CustomFields.owner': 'Infra team',
        'XenCenter.CustomFields.rack': 'B12',
      },
    })

    expect(getSrCustomFields(sr)).toEqual({ owner: 'Infra team', rack: 'B12' })
  })

  it('leaves out the entries that are not custom fields', () => {
    const sr = createSr({
      other_config: {
        'XenCenter.CustomFields.owner': 'Infra team',
        auto_poweron: 'true',
      },
    })

    expect(getSrCustomFields(sr)).toEqual({ owner: 'Infra team' })
  })

  it('is empty when the SR carries no custom field', () => {
    expect(getSrCustomFields(createSr({ other_config: { auto_poweron: 'true' } }))).toEqual({})
  })

  it('is empty when the SR carries no other config at all', () => {
    expect(getSrCustomFields(createSr({ other_config: {} }))).toEqual({})
  })
})
