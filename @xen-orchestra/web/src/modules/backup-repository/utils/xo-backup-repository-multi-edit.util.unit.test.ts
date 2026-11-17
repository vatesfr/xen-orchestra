import { mergeValues, omitMixedValues } from '@/modules/backup-repository/utils/xo-backup-repository-multi-edit.util.ts'

const MIXED_VALUE = '[Mixed]'

describe('mergeValues', () => {
  it('keeps the values shared by all the repositories', () => {
    expect(
      mergeValues(
        [
          { host: '192.168.1.10', useHttps: true },
          { host: '192.168.1.10', useHttps: true },
        ],
        MIXED_VALUE
      )
    ).toEqual({ data: { host: '192.168.1.10', useHttps: true }, mixedFields: [] })
  })

  it('shows the mixed value for a text which differs between the repositories', () => {
    expect(mergeValues([{ host: '192.168.1.10' }, { host: '192.168.1.20' }], MIXED_VALUE)).toEqual({
      data: { host: MIXED_VALUE },
      mixedFields: ['host'],
    })
  })

  it('leaves undefined a value of another kind which differs between the repositories', () => {
    expect(mergeValues([{ useHttps: true }, { useHttps: false }], MIXED_VALUE)).toEqual({
      data: { useHttps: undefined },
      mixedFields: ['useHttps'],
    })
  })

  it('only treats the given fields as texts when they are listed', () => {
    expect(
      mergeValues(
        [
          { name: 'First', type: 'nfs' },
          { name: 'Second', type: 'smb' },
        ],
        MIXED_VALUE,
        ['name']
      )
    ).toEqual({ data: { name: MIXED_VALUE, type: undefined }, mixedFields: ['name', 'type'] })
  })

  it('returns no data without repository', () => {
    expect(mergeValues([], MIXED_VALUE)).toEqual({ data: {}, mixedFields: [] })
  })
})

describe('omitMixedValues', () => {
  it('keeps only the values to apply to all the repositories', () => {
    expect(
      omitMixedValues({ host: MIXED_VALUE, path: '/exports/backups', useHttps: undefined, port: '' }, MIXED_VALUE)
    ).toEqual({ path: '/exports/backups', port: '' })
  })
})
