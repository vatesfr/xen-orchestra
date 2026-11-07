import * as openpgp from 'openpgp'
import { createLogger } from '@xen-orchestra/log'
import { findLeaks, redact } from '@vates/obfuscate'
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators'
import { Readable } from 'node:stream'
import { createGzip } from 'node:zlib'
import { pipeline } from 'node:stream/promises'
import type { XoPool, XoServer } from '@vates/types'

import type { SupportBundleParams, SupportBundleGroup } from './support-bundle.type.mjs'

import {
  CONFIG_ENTRIES_BY_GROUP,
  SECRET_SOURCE_CONFIG_ENTRIES,
  collectConfigSecrets,
  collectXapiSecrets,
  getXapiTypeGroup,
  redactConfigEntry,
  redactXapiRecord,
} from './support-bundle.helper.mjs'
import { makeNdJsonStream } from '../helpers/stream.helper.mjs'
import { RestApi } from '../rest-api/rest-api.mjs'

const log = createLogger('xo:rest-api:support-bundle')

const ALL_GROUPS: SupportBundleGroup[] = [
  'backups',
  'misc',
  'plugins',
  'pools',
  'tasks',
  'users',
  'vms',
  'xapiMessages',
]

// the `tasks` store holds XO tasks, the `logs` store holds legacy backup logs
const TASK_STORES = [
  { store: 'tasks', timestampField: 'start' },
  { store: 'logs', timestampField: 'time' },
]

type XapiRecord = Record<string, unknown>
type PoolXapi = {
  poolId: XoPool['id']
  serverId: XoServer['id']
  recordsByType: Record<string, Record<string, XapiRecord & { $ref: string }>>
}

type PreparedExport = SupportBundleParams & {
  config: Record<string, unknown>
  poolXapis: PoolXapi[]
  secrets: Set<string>
  selectedGroups: Set<SupportBundleGroup>
}

@provide(SupportBundleService)
export class SupportBundleService {
  #restApi: RestApi

  constructor(@inject(RestApi) restApi: RestApi) {
    this.#restApi = restApi
  }

  /**
   * gzipped NDJSON lines encrypted with the passphrase, the last line is the manifest
   *
   * the stream errors without manifest if a known secret is found in a line
   */
  async createExportStream(params: SupportBundleParams): Promise<Readable> {
    // done before streaming so that failures are reported as HTTP errors
    const prepared = await this.#prepare(params)

    // compressed here because OpenPGP compression does not forward errors of its input,
    // which leaves the HTTP response hanging when a secret is found
    const gzip = createGzip()
    pipeline(Readable.from(makeNdJsonStream(this.#generateLines(prepared)), { objectMode: false }), gzip).catch(error =>
      log.warn('support bundle generation failed', { error })
    )

    const message = await openpgp.createMessage({ binary: gzip })
    return (await openpgp.encrypt({ message, passwords: params.passphrase, format: 'binary' })) as unknown as Readable
  }

  async #prepare(params: SupportBundleParams): Promise<PreparedExport> {
    const { groups = ALL_GROUPS, passphrase } = params
    const exportedEntries = groups.flatMap(group => CONFIG_ENTRIES_BY_GROUP[group] ?? [])
    const config = await this.#readConfig(
      [...new Set([...exportedEntries, ...SECRET_SOURCE_CONFIG_ENTRIES])],
      passphrase
    )

    const poolXapis = Object.keys(this.#restApi.getObjectsByType<XoPool>('pool')).map(poolId => ({
      poolId: poolId as XoPool['id'],
      serverId: this.#restApi.xoApp.getXenServerIdByObject(poolId as XoPool['id'], 'pool'),
      recordsByType: this.#restApi.xoApp.getXapi(poolId as XoPool['id']).objects.indexes
        .type as unknown as PoolXapi['recordsByType'],
    }))

    // collected from all pools and entries, even those not exported, to detect a copy in any exported value
    const secrets = new Set<string>()
    for (const [entry, data] of Object.entries(config)) {
      collectConfigSecrets(secrets, entry, data)
    }
    for (const { recordsByType } of poolXapis) {
      for (const [type, records] of Object.entries(recordsByType)) {
        Object.values(records).forEach(record => collectXapiSecrets(secrets, type, record))
      }
    }

    return {
      ...params,
      config: Object.fromEntries(exportedEntries.map(entry => [entry, config[entry]])),
      poolXapis,
      secrets,
      selectedGroups: new Set(groups),
    }
  }

  async #readConfig(entries: string[], passphrase: string): Promise<Record<string, unknown>> {
    // exportConfig requires a passphrase when credentials are encrypted in the database
    const encryptedConfig = await this.#restApi.xoApp.exportConfig({ entries, passphrase })
    const { data } = await openpgp.decrypt({
      message: await openpgp.readMessage({ binaryMessage: encryptedConfig }),
      passwords: passphrase,
      format: 'binary',
    })
    // not a stream since the message is a buffer
    return JSON.parse(Buffer.from(data as Uint8Array).toString())
  }

  async *#generateLines({ config, poolXapis, pools, secrets, selectedGroups, tasksSince }: PreparedExport) {
    const counts: Record<string, number> = {}
    const checked = <T extends { group: SupportBundleGroup }>(line: T): T => {
      const leaks = findLeaks(line, secrets)
      if (leaks.length !== 0) {
        throw new Error(`secrets found in support bundle at ${leaks.join(', ')}`)
      }
      counts[line.group] = (counts[line.group] ?? 0) + 1
      return line
    }

    for (const group of selectedGroups) {
      for (const entry of CONFIG_ENTRIES_BY_GROUP[group] ?? []) {
        let data = config[entry]
        if (entry === 'xenServers') {
          // only known at runtime, links a server to its XAPI objects
          const poolIdsByServer = new Map(poolXapis.map(({ poolId, serverId }) => [serverId, poolId]))
          data = (data as XoServer[])
            .map(server => ({ ...server, poolId: poolIdsByServer.get(server.id) }))
            .filter(server => pools === undefined || (server.poolId !== undefined && pools.includes(server.poolId)))
        }
        yield checked({ kind: 'config', group, entry, data: redactConfigEntry(entry, data) })
      }
    }

    for (const { poolId, recordsByType } of poolXapis) {
      if (pools !== undefined && !pools.includes(poolId)) {
        continue
      }
      for (const [type, records] of Object.entries(recordsByType)) {
        const group = getXapiTypeGroup(type)
        if (group === undefined || !selectedGroups.has(group)) {
          continue
        }
        for (const record of Object.values(records)) {
          // own enumerable properties are the raw XAPI fields
          yield checked({
            kind: 'xapi',
            group,
            poolId,
            type,
            ref: record.$ref,
            record: redactXapiRecord(type, { ...record }),
          })
        }
      }
    }

    if (selectedGroups.has('tasks')) {
      for (const { store, timestampField } of TASK_STORES) {
        const db = await this.#restApi.xoApp.getStore(store)
        for await (const { key, value } of db.createReadStream() as AsyncIterable<{ key: string; value: XapiRecord }>) {
          const timestamp = value?.[timestampField]
          if (tasksSince !== undefined && !(typeof timestamp === 'number' && timestamp >= tasksSince)) {
            continue
          }
          yield checked({ kind: 'task', group: 'tasks', store, key, value: redact(value) })
        }
      }
    }

    yield {
      kind: 'manifest',
      date: Date.now(),
      // to debug with the same version
      xoServerVersion: this.#restApi.xoApp.version,
      groups: [...selectedGroups],
      pools,
      tasksSince,
      counts,
      checkedSecrets: secrets.size,
    }
  }
}
