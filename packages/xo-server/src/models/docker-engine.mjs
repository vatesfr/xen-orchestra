import { objectAlreadyExists } from 'xo-common/api-errors.js'

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
export class DockerEngines extends Collection {
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
