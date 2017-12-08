import execa from 'execa'
import fs from 'fs-extra'

import LocalHandler from './local'
import {
  forEach
} from '../utils'

export default class NfsHandler extends LocalHandler {
  get type () {
    return 'nfs'
  }

  _getRealPath () {
    return `/run/xo-server/mounts/${this._remote.id}`
  }

  async _loadRealMounts () {
    let stdout
    const mounted = {}
    try {
      stdout = await execa.stdout('findmnt', ['-P', '-t', 'nfs,nfs4', '--output', 'SOURCE,TARGET', '--noheadings'])
      const regex = /^SOURCE="([^:]*):(.*)" TARGET="(.*)"$/
      forEach(stdout.split('\n'), m => {
        if (m) {
          const match = regex.exec(m)
          mounted[match[3]] = {
            host: match[1],
            share: match[2]
          }
        }
      })
    } catch (exc) {
      // When no mounts are found, the call pretends to fail...
      if (exc.stderr !== '') {
        throw exc
      }
    }

    this._realMounts = mounted
    return mounted
  }

  _matchesRealMount () {
    return this._getRealPath() in this._realMounts
  }

  async _mount () {
    await fs.ensureDir(this._getRealPath())
    return execa('mount', ['-t', 'nfs', '-o', 'vers=3', `${this._remote.host}:${this._remote.path}`, this._getRealPath()])
  }

  async _sync () {
    await this._loadRealMounts()
    if (this._matchesRealMount() && !this._remote.enabled) {
      try {
        await this._umount(this._remote)
      } catch (exc) {
        this._remote.enabled = true
        this._remote.error = exc.message
      }
    } else if (!this._matchesRealMount() && this._remote.enabled) {
      try {
        await this._mount()
      } catch (exc) {
        this._remote.enabled = false
        this._remote.error = exc.message
      }
    }
    return this._remote
  }

  async _forget () {
    try {
      await this._umount(this._remote)
    } catch (_) {
      // We have to go on...
    }
  }

  async _umount (remote) {
    await execa('umount', ['--force', this._getRealPath()])
  }
}
