import fs from 'fs-promise'
import RemoteHandlerAbstract from './abstract'
import {dirname} from 'path'
import {exec} from 'child_process'
import {forEach, promisify} from '../utils'

const execAsync = promisify(exec)

export default class NfsHandler extends RemoteHandlerAbstract {
  _getFilePath (file) {
    const parts = [this._remote.path]
    if (file) {
      parts.push(file)
    }
    return parts.join('/')
  }

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

  async sync () {
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

  async forget () {
    try {
      await this._umount(this._remote)
    } catch (_) {
      // We have to go on...
    }
  }

  async _umount (remote) {
    await execAsync(`umount ${remote.path}`)
  }

  async outputFile (file, data, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    await fs.writeFile(path, data, options)
  }

  async readFile (file, options) {
    return await fs.readFile(this._getFilePath(file), options)
  }

  async rename (oldPath, newPath) {
    return await fs.rename(this._getFilePath(oldPath), this._getFilePath(newPath))
  }

  async list (dir = undefined) {
    return await fs.readdir(this._getFilePath(dir))
  }

  async createReadStream (file) {
    return fs.createReadStream(this._getFilePath(file))
  }

  async createOutputStream (file, options) {
    const path = this._getFilePath(file)
    await fs.ensureDir(dirname(path))
    return fs.createWriteStream(path, options)
  }

  async unlink (file) {
    return fs.unlink(this._getFilePath(file))
  }

  async getSize (file) {
    const stats = await fs.stat(this._getFilePath(file))
    return stats.size
  }
}
