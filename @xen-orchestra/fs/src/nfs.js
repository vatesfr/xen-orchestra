import execa from 'execa'
import fs from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'

import LocalHandler from './local'

const DEFAULT_NFS_OPTIONS = 'vers=3'

const sudoExeca = (command, args, opts) =>
  execa('sudo', [command, ...args], opts)

export default class NfsHandler extends LocalHandler {
  constructor(
    remote,
    {
      mountsDir = join(tmpdir(), 'xo-fs-mounts'),
      useSudo = false,
      ...opts
    } = {}
  ) {
    super(remote, opts)

    this._realPath = join(
      mountsDir,
      remote.id ||
        Math.random()
          .toString(36)
          .slice(2)
    )
    this._execa = useSudo ? sudoExeca : execa
  }

  get type() {
    return 'nfs'
  }

  _getRealPath() {
    return this._realPath
  }

  async _mount() {
    await fs.ensureDir(this._getRealPath())
    const { host, path, port, options } = this._remote
    return this._execa(
      'mount',
      [
        '-t',
        'nfs',
        '-o',
        DEFAULT_NFS_OPTIONS + (options !== undefined ? `,${options}` : ''),
        `${host}${port !== undefined ? ':' + port : ''}:${path}`,
        this._getRealPath(),
      ],
      {
        env: {
          LANG: 'C',
        },
      }
    ).catch(error => {
      if (
        error == null ||
        typeof error.stderr !== 'string' ||
        !error.stderr.includes('already mounted')
      ) {
        throw error
      }
    })
  }

  async _umount() {
    await this._execa('umount', ['--force', this._getRealPath()], {
      env: {
        LANG: 'C',
      },
    }).catch(error => {
      if (
        error == null ||
        typeof error.stderr !== 'string' ||
        !error.stderr.includes('not mounted')
      ) {
        throw error
      }
    })
  }

  async _forget() {
    try {
      await this._umount(this._remote)
    } catch (_) {
      // We have to go on...
    }
  }

  async _sync() {
    await this._mount()

    return this._remote
  }
}
