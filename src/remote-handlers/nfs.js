import fs from 'fs-promise'
import LocalHandler from './local'
import {exec} from 'child_process'
import {forEach, promisify} from '../utils'

const execAsync = promisify(exec)

export default class NfsHandler extends LocalHandler {
  async _loadRealMounts () {
    let stdout
    try {
      [stdout] = await execAsync('findmnt -P -t nfs,nfs4 --output SOURCE,TARGET --noheadings')
    } catch (exc) {
      // When no mounts are found, the call pretends to fail...
    }
    const mounted = {}
    if (stdout) {
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
    }
    this._realMounts = mounted
    return mounted
  }

  _matchesRealMount (remote) {
    return remote.path in this._realMounts
  }

  async _mount (remote) {
    await fs.ensureDir(remote.path)
    return await execAsync(`mount -t nfs ${remote.host}:${remote.share} ${remote.path}`)
  }

  async _sync () {
    await this._loadRealMounts()
    if (this._matchesRealMount(this._remote) && !this._remote.enabled) {
      try {
        await this._umount(this._remote)
      } catch (exc) {
        this._remote.enabled = true
        this._remote.error = exc.message
      }
    } else if (!this._matchesRealMount(this._remote) && this._remote.enabled) {
      try {
        await this._mount(this._remote)
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
    await execAsync(`umount ${remote.path}`)
  }
}
