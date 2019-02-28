import execa from 'execa'
import fs from 'fs-extra'
import { ignoreErrors } from 'promise-toolbox'
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
    this._params = {
      ...params,
      options: [params.options, remote.options]
        .filter(_ => _ !== undefined)
        .join(','),
    }
    this._realPath = join(
      mountsDir,
      remote.id ||
        Math.random()
          .toString(36)
          .slice(2)
    )
  }

  async _forget() {
    const keeper = this._keeper
    if (keeper === undefined) {
      return
    }
    await fs.close(keeper)

    await ignoreErrors.call(
      this._execa('umount', [this._getRealPath()], {
        env: {
          LANG: 'C',
        },
      })
    )
  }

  _getRealPath() {
    return this._realPath
  }

  async _sync() {
    const realPath = this._getRealPath()

    await fs.ensureDir(realPath)

    try {
      const { type, device, options, env } = this._params
      await this._execa(
        'mount',
        ['-t', type, device, realPath, '-o', options],
        {
          env: {
            LANG: 'C',
            ...env,
          },
        }
      )
    } catch (error) {
      let stderr
      if (
        error == null ||
        typeof (stderr = error.stderr) !== 'string' ||
        !(stderr.includes('already mounted') || stderr.includes('busy'))
      ) {
        throw error
      }
    }

    // keep an open file on the mount to prevent it from being unmounted if used
    // by another handler/process
    const keeperPath = `${realPath}/.keeper_${Math.random()
      .toString(36)
      .slice(2)}`
    this._keeper = await fs.open(keeperPath, 'w')
    ignoreErrors.call(fs.unlink(keeperPath))
  }
}
