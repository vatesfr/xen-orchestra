import execa from 'execa'
import fs from 'fs-extra'
import { join } from 'path'
import { tmpdir } from 'os'

import LocalHandler from './local'

const sudoExeca = (command, args, opts) =>
  execa('sudo', [command, ...args], opts)

export default class MountHandler extends LocalHandler {
  constructor(
    remote,
    {
      mountsDir = join(tmpdir(), 'xo-fs-mounts'),
      useSudo = false,
      ...opts
    } = {},
    params
  ) {
    super(remote, opts)

    this._execa = useSudo ? sudoExeca : execa
    this._params = params
    this._realPath = join(
      mountsDir,
      remote.id ||
        Math.random()
          .toString(36)
          .slice(2)
    )
  }

  async _forget() {
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

  _getRealPath() {
    return this._realPath
  }

  async _sync() {
    await fs.ensureDir(this._getRealPath())
    const { type, device, options, env } = this._params
    return this._execa(
      'mount',
      ['-t', type, device, this._getRealPath(), '-o', options],
      {
        env: {
          LANG: 'C',
          ...env,
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
}
