import Bluebird from 'bluebird'
import filter from 'lodash.filter'
import forEach from 'lodash.foreach'
import fs from 'fs-extra'
import {exec} from 'child_process'

const execAsync = Bluebird.promisify(exec)
Bluebird.promisifyAll(fs)

const noop = () => {}

class NfsMounter {
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

  _fullPath (path) {
    return path
  }

  _matchesRealMount (mount) {
    return this._fullPath(mount.path) in this._realMounts
  }

  async _mount (mount) {
    const path = this._fullPath(mount.path)
    await fs.ensureDirAsync(path)
    return await execAsync(`mount -t nfs ${mount.host}:${mount.share} ${path}`)
  }

  async forget (mount) {
    try {
      await this._umount(mount)
    } catch (_) {
      // We have to go on...
    }
  }

  async _umount (mount) {
    const path = this._fullPath(mount.path)
    await execAsync(`umount ${path}`)
  }

  async sync (mount) {
    await this._loadRealMounts()
    if (this._matchesRealMount(mount) && !mount.enabled) {
      try {
        await this._umount(mount)
      } catch (exc) {
        mount.enabled = true
        mount.error = exc.message
      }
    } else if (!this._matchesRealMount(mount) && mount.enabled) {
      try {
        await this._mount(mount)
      } catch (exc) {
        mount.enabled = false
        mount.error = exc.message
      }
    }
    return mount
  }

  async disableAll (mounts) {
    await this._loadRealMounts()
    forEach(mounts, async mount => {
      if (this._matchesRealMount(mount)) {
        try {
          await this._umount(mount)
        } catch (_) {
          // We have to go on...
        }
      }
    })
  }
}

class LocalHandler {
  constructor () {
    this.forget = noop
    this.disableAll = noop
  }

  async sync (local) {
    if (local.enabled) {
      try {
        await fs.ensureDirAsync(local.path)
        await fs.accessAsync(local.path, fs.R_OK | fs.W_OK)
      } catch (exc) {
        local.enabled = false
        local.error = exc.message
      }
    }
    return local
  }
}

export default class RemoteHandler {
  constructor () {
    this.handlers = {
      nfs: new NfsMounter(),
      local: new LocalHandler()
    }
  }

  async sync (remote) {
    return await this.handlers[remote.type].sync(remote)
  }

  async forget (remote) {
    return await this.handlers[remote.type].forget(remote)
  }

  async disableAll (remotes) {
    const promises = []
    forEach(['local', 'nfs'], type => promises.push(this.handlers[type].disableAll(filter(remotes, remote => remote.type === type))))
    await Promise.all(promises)
  }
}
