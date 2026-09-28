// @ts-check

import { noSuchObject, objectAlreadyExists } from 'xo-common/api-errors.js'

import Collection from '../collection/redis.mjs'

// ===================================================================

// Docker engines reached through SSH, see `xo-mixins/docker.mjs`
//
// Stored fields: `vm` (optional, indexed), `label`, `host`, `port`, `username`,
// `password`, `privateKey`, `passphrase`, `socketPath`, `hostKeyFingerprint`,
// `hostKeyAlgorithm`, `revision`.
//
// Records are stored as JSON, the whole record being encrypted when
// `redis.encryptCredentialDatabase` is enabled (see `collection/redis.mjs`).

/**
 * A stored engine, secrets included: never exposed as is (see `#sanitize()` in
 * `xo-mixins/docker.mjs`, which returns an `XoDockerEngine`)
 *
 * @typedef {{
 *   id: import('@vates/types').XoDockerEngine['id'],
 *   vm?: import('@vates/types').XoVm['id'],
 *   label?: string,
 *   host?: string,
 *   port: number,
 *   username: string,
 *   password?: string,
 *   privateKey?: string,
 *   passphrase?: string,
 *   socketPath: string,
 *   hostKeyFingerprint?: string,
 *   hostKeyAlgorithm?: string,
 *   revision?: string,
 * }} DockerEngineRecord
 */

export class DockerEngines extends Collection {
  // writes (add, update, which both use `_add()`, and remove) are serialized,
  // one record at a time: the one-engine-per-VM check reads the `vm` index,
  // which is only written at the end of `_add()`, so two concurrent writes on
  // the same VM would both pass it
  //
  // In-process only: xo-server is the only writer of this collection.
  /** @type {Promise<unknown>} */
  #writes = Promise.resolve()

  /**
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  #serialize(fn) {
    const write = this.#writes.then(fn)
    this.#writes = write.catch(() => {})
    return write
  }

  async #addSequentially(models, opts) {
    const result = []
    for (const model of models) {
      result.push(...(await super._add([model], opts)))
    }
    return result
  }

  _add(models, opts) {
    return this.#serialize(() => this.#addSequentially(models, opts))
  }

  // unlike the base collection, an update never (re-)creates a record: a
  // removed engine stays removed (`add(…, { replace: true })` still upserts)
  _update(models) {
    return this.#serialize(async () => {
      for (const { id } of models) {
        if ((await this.first(id)) === undefined) {
          throw noSuchObject(id, 'docker-engine')
        }
      }
      return this.#addSequentially(models, { replace: true })
    })
  }

  _remove(ids) {
    return this.#serialize(() => super._remove(ids))
  }

  // v1: at most one engine per VM
  async #assertNoEngineForVm(vm) {
    const existing = await this.first({ vm })
    if (existing !== undefined) {
      throw objectAlreadyExists({ objectId: existing.id, objectType: 'docker-engine' })
    }
  }

  async _beforeAdd(record) {
    if (record.vm !== undefined) {
      await this.#assertNoEngineForVm(record.vm)
    }
  }

  async _beforeUpdate(record, previous) {
    // the record being updated is not in the index for its new VM, any match
    // is another record
    if (record.vm !== undefined && record.vm !== previous.vm) {
      await this.#assertNoEngineForVm(record.vm)
    }
  }
}
