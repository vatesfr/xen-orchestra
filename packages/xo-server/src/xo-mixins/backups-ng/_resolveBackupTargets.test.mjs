import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildRunContext } from '@xen-orchestra/backups/_buildContext.mjs'

import { resolveBackupRepositories, resolveBackupSrs } from './_resolveBackupTargets.mjs'

// a Monday, at 22:00 UTC
const RUN_CONTEXT = buildRunContext(new Date('2026-11-02T22:00:00Z'), 'UTC')

const sr = ({ uuid, name_label = uuid, SR_type = 'nfs', content_type = 'user', size = 100, tags = [] }) => ({
  uuid,
  name_label,
  name_description: '',
  SR_type,
  content_type,
  size,
  tags,
})

const backupRepository = ({ id, name = id, url = 'nfs://nas:/backups', enabled = true, proxy }) => ({
  id,
  name,
  url,
  enabled,
  proxy,
})

describe('resolveBackupSrs()', () => {
  it('returns the SRs matching the expression', () => {
    const srs = [sr({ uuid: 'nfs-sr' }), sr({ uuid: 'local-sr', SR_type: 'ext' })]

    assert.deepEqual(resolveBackupSrs({ srs: 'sr:type:nfs' }, srs, RUN_CONTEXT), ['nfs-sr'])
  })

  it('never returns an ISO or empty SR', () => {
    const srs = [sr({ uuid: 'writable' }), sr({ uuid: 'iso', content_type: 'iso' }), sr({ uuid: 'empty', size: 0 })]

    assert.deepEqual(resolveBackupSrs({ srs: 'sr:type:nfs' }, srs, RUN_CONTEXT), ['writable'])
  })

  it('evaluates the run context', () => {
    const srs = [sr({ uuid: 'nfs-sr' })]

    assert.deepEqual(resolveBackupSrs({ srs: 'run:hour:22' }, srs, RUN_CONTEXT), ['nfs-sr'])
    assert.deepEqual(resolveBackupSrs({ srs: 'run:hour:23' }, srs, RUN_CONTEXT), [])
  })

  it('returns an empty array when nothing matches', () => {
    const srs = [sr({ uuid: 'nfs-sr' })]

    assert.deepEqual(resolveBackupSrs({ srs: 'sr:name_label:missing' }, srs, RUN_CONTEXT), [])
  })
})

describe('resolveBackupRepositories()', () => {
  it('returns the backup repositories matching the expression', () => {
    const backupRepositories = [
      backupRepository({ id: 'nfs-br' }),
      backupRepository({ id: 'local-br', url: 'file:///media/backups' }),
    ]

    assert.deepEqual(
      resolveBackupRepositories({ remotes: 'backupRepository:type:nfs' }, backupRepositories, RUN_CONTEXT),
      {
        backupRepositoryIds: ['nfs-br'],
        proxySkippedIds: [],
        invalidUrlIds: [],
      }
    )
  })

  it('skips a disabled backup repository silently', () => {
    const backupRepositories = [
      backupRepository({ id: 'enabled' }),
      backupRepository({ id: 'disabled', enabled: false }),
    ]

    assert.deepEqual(
      resolveBackupRepositories({ remotes: 'backupRepository:type:nfs' }, backupRepositories, RUN_CONTEXT),
      {
        backupRepositoryIds: ['enabled'],
        proxySkippedIds: [],
        invalidUrlIds: [],
      }
    )
  })

  it('skips a matching backup repository linked to another proxy', () => {
    const backupRepositories = [
      backupRepository({ id: 'same-proxy', proxy: 'proxy-1' }),
      backupRepository({ id: 'other-proxy', proxy: 'proxy-2' }),
      backupRepository({ id: 'no-proxy' }),
    ]

    assert.deepEqual(
      resolveBackupRepositories(
        { remotes: 'backupRepository:type:nfs', proxy: 'proxy-1' },
        backupRepositories,
        RUN_CONTEXT
      ),
      { backupRepositoryIds: ['same-proxy'], proxySkippedIds: ['other-proxy', 'no-proxy'], invalidUrlIds: [] }
    )
  })

  it('skips a matching backup repository whose URL cannot be parsed', () => {
    const backupRepositories = [
      backupRepository({ id: 'nfs-br' }),
      backupRepository({ id: 'invalid', url: 'foo://bar' }),
    ]

    // without the URL check, the negation would pick the invalid repository, its type being undefined
    assert.deepEqual(
      resolveBackupRepositories({ remotes: '!backupRepository:type:nfs' }, backupRepositories, RUN_CONTEXT),
      {
        backupRepositoryIds: [],
        proxySkippedIds: [],
        invalidUrlIds: ['invalid'],
      }
    )
  })

  it('does not report an invalid backup repository the expression does not match', () => {
    const backupRepositories = [
      backupRepository({ id: 'nfs-br' }),
      backupRepository({ id: 'invalid', url: 'foo://bar' }),
    ]

    assert.deepEqual(
      resolveBackupRepositories({ remotes: 'backupRepository:name:nfs-br' }, backupRepositories, RUN_CONTEXT),
      {
        backupRepositoryIds: ['nfs-br'],
        proxySkippedIds: [],
        invalidUrlIds: [],
      }
    )
  })

  it('returns empty arrays when nothing matches', () => {
    const backupRepositories = [backupRepository({ id: 'nfs-br' })]

    assert.deepEqual(
      resolveBackupRepositories({ remotes: 'backupRepository:type:s3' }, backupRepositories, RUN_CONTEXT),
      {
        backupRepositoryIds: [],
        proxySkippedIds: [],
        invalidUrlIds: [],
      }
    )
  })
})
