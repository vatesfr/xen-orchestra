// @ts-check

/**
 * @typedef {import('@xen-orchestra/disk-transform').FileAccessor} FileAccessor
 */

import { DiskAlias, AliasMissingError, AliasIsDirectoryError } from '@xen-orchestra/disk-transform'
import { normalize } from '@xen-orchestra/fs/path'
import { RemoteDisk } from './RemoteDisk.mjs'

/**
 * A RemoteDisk backed by a single handler + path (possibly an alias to another path).
 * Owns the alias-driven rename/unlink/clean/listAssociatedFiles logic so format-specific
 * subclasses (RemoteVhdDisk, and later others) don't have to reimplement it.
 */
export class RemotePathDisk extends RemoteDisk {
  /** @type {FileAccessor} */
  #handler

  /** @type {string} */
  #path

  /** @type {DiskAlias} */
  #alias

  /**
   * @param {Object} params
   * @param {FileAccessor} params.handler
   * @param {string} params.path
   * @param {string} params.extension - e.g. 'vhd', used to build the `*.alias.<extension>` suffix
   */
  constructor({ handler, path, extension }) {
    super()
    this.#handler = handler
    this.#path = path
    this.#alias = new DiskAlias(extension)
  }

  /** @returns {FileAccessor} */
  get handler() {
    return this.#handler
  }

  /** @returns {string} */
  get path() {
    return this.#path
  }

  set path(newPath) {
    this.#path = newPath
  }

  /** @returns {DiskAlias} */
  get alias() {
    return this.#alias
  }

  /**
   * Abstract - true once the disk's format-specific state has been opened (e.g. after init()).
   * @returns {boolean}
   */
  get isOpen() {
    throw new Error('isOpen must be implemented')
  }

  /**
   * Abstract - throws if `target` isn't a valid, openable disk of this format.
   * @param {string} target
   * @returns {Promise<void>}
   */
  async validateTarget(target) {
    throw new Error('validateTarget must be implemented')
  }

  /**
   * @returns {string}
   */
  getPath() {
    return this.path
  }

  /**
   * @returns {string[]}
   */
  getPaths() {
    return [this.getPath()]
  }

  /**
   * Rename alias/disk
   * @param {string} newPath
   */
  async rename(newPath) {
    const { handler, alias } = this
    if (alias.isAlias(newPath)) {
      const dataPath = await alias.resolve(handler, this.path)
      await handler.unlink(newPath)
      await alias.create(handler, newPath, dataPath)
      await handler.unlink(this.path)
      this.path = newPath
    } else {
      try {
        await handler.unlink(newPath)
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
          await handler.rmtree(newPath).catch(() => {})
        }
      }
      await handler.rename(this.path, newPath)
      this.path = newPath
    }
  }

  /**
   * Deletes alias/disk
   * @param {Object} options
   * @param {boolean} [options.force]
   */
  async unlink({ force = false } = {}) {
    const { handler, alias } = this

    if (!this.isOpen) {
      if (!force) {
        throw new Error(`can't call unlink of a ${this.constructor.name} before init`)
      }
      await alias.unlink(handler, this.path)
      return
    }

    await this.close()

    if (alias.isAlias(this.path)) {
      try {
        await handler.unlink(await alias.resolve(handler, this.path))
      } catch (err) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
          await handler.rmtree(await alias.resolve(handler, this.path)).catch(() => {})
        }
      }
    }
    try {
      await handler.unlink(this.path)
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'EISDIR') {
        await handler.rmtree(this.path).catch(() => {})
      }
    }
  }

  /**
   * Returns all file paths within dir that this disk claims.
   * For a plain disk: [path]
   * For an alias: [aliasPath, resolvedDataPath]
   * If the alias target cannot be resolved, only the alias path is returned.
   *
   * @param {string} dir
   * @returns {Promise<string[]>}
   */
  async listAssociatedFiles(dir) {
    const { handler, alias } = this
    const prefix = normalize(dir.endsWith('/') ? dir : dir + '/')
    const isInDir = /** @param {string} p */ p => p === dir || p.startsWith(prefix)

    const files = []
    if (isInDir(this.path)) {
      files.push(this.path)
    }

    if (alias.isAlias(this.path)) {
      try {
        const resolved = await alias.resolve(handler, this.path)
        if (isInDir(resolved)) {
          files.push(resolved)
        }
      } catch {
        // broken alias, no data file to claim
      }
    }

    return files
  }

  /**
   * Checks the integrity of this disk's alias reference.
   * Only meaningful for alias files; no-op for plain disks.
   * Returns the resolved target path when the alias is valid, undefined otherwise.
   *
   * @param {Object} [opts]
   * @param {boolean} [opts.remove]
   * @param {Function} [opts.logWarn]
   * @param {Function} [opts.logInfo]
   * @returns {Promise<string | undefined>}
   */
  async clean({ remove = false, logWarn = () => {}, logInfo = () => {} } = {}) {
    const { handler, alias } = this

    if (!alias.isAlias(this.path)) {
      return undefined
    }

    let target
    try {
      target = await alias.resolve(handler, this.path)
    } catch (err) {
      if (err instanceof AliasMissingError) {
        logWarn('missing target of alias', { alias: this.path })
        if (remove) {
          logInfo('removing alias with missing target', { alias: this.path })
          await handler.unlink(this.path)
        }
        return undefined
      }
      if (err instanceof AliasIsDirectoryError) {
        logWarn('alias is a directory', { alias: this.path })
        if (remove) {
          logInfo('removing directory named as alias', { alias: this.path })
          await alias.unlink(handler, this.path)
        }
        return undefined
      }
      logWarn('unhandled error while checking alias', { alias: this.path, err })
      return undefined
    }

    if (target === '') {
      logWarn('empty target for alias', { alias: this.path })
      if (remove) {
        logInfo('removing alias with empty target', { alias: this.path })
        await handler.unlink(this.path)
      }
      return undefined
    }

    try {
      await this.validateTarget(target)
      return target
    } catch (error) {
      if (error?.invalidTargetName) {
        logWarn('alias references an invalid target', { alias: this.path, target })
        if (remove) {
          logInfo('removing alias and invalid target', { alias: this.path, target })
          await handler.unlink(target)
          await handler.unlink(this.path)
        }
        return undefined
      }
      logWarn('missing or broken alias target', { alias: this.path, target, error })
      if (remove) {
        try {
          await alias.unlink(handler, this.path)
        } catch (err) {
          if (err.code !== 'ENOENT') {
            logWarn('error deleting broken alias', { alias: this.path, target, err })
          }
        }
      }
      return undefined
    }
  }
}
