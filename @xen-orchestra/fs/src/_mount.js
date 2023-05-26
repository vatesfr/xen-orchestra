import execa from 'execa'
import fs from 'fs-extra'
import { ignoreErrors } from 'promise-toolbox'
import { join } from 'path'
import { tmpdir } from 'os'

import LocalHandler from './local'

const sudoExeca = (command, args, opts) => execa('sudo', [command, ...args], opts)

export default class MountHandler extends LocalHandler {
  #execa
  #keeper
  #params
  #realPath

  constructor(remote, { mountsDir = join(tmpdir(), 'xo-fs-mounts'), useSudo = false, ...opts } = {}, params) {
    super(remote, opts)

    this.#execa = useSudo ? sudoExeca : execa
    this.#params = {
      ...params,
      options: [params.options, remote.options ?? params.defaultOptions].filter(_ => _ !== undefined).join(','),
    }
    this.#realPath = join(mountsDir, remote.id || Math.random().toString(36).slice(2))
  }

  async _forget() {
    const keeper = this.#keeper
    if (keeper === undefined) {
      return
    }
    this.#keeper = undefined
    await fs.close(keeper)

    await ignoreErrors.call(
      this.#execa('umount', [this.getRealPath()], {
        env: {
          LANG: 'C',
        },
      })
    )
  }

  getRealPath() {
    return this.#realPath
  }

  async _sync() {
    // in case of multiple `sync`s, ensure we properly close previous keeper
    {
      const keeper = this.#keeper
      if (keeper !== undefined) {
        this.#keeper = undefined
        ignoreErrors.call(fs.close(keeper))
      }
    }

    const realPath = this.getRealPath()

    await fs.ensureDir(realPath)

    try {
      const { type, device, options, env } = this.#params

      // Linux mount is more flexible in which order the mount arguments appear.
      // But FreeBSD requires this order of the arguments.
      await this.#execa('mount', ['-o', options, '-t', type, device, realPath], {
        env: {
          LANG: 'C',
          ...env,
        },
      })
    } catch (error) {
      try {
        // the failure may mean it's already mounted, use `findmnt` to check
        // that's the case
        await this.#execa('findmnt', [realPath], {
          stdio: 'ignore',
        })
      } catch (_) {
        throw error
      }
    }

    // keep an open file on the mount to prevent it from being unmounted if used
    // by another handler/process
    const keeperPath = `${realPath}/.keeper_${Math.random().toString(36).slice(2)}`
    this.#keeper = await fs.open(keeperPath, 'w')
    ignoreErrors.call(fs.unlink(keeperPath))
  }
}
