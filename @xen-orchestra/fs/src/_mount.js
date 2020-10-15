import execa from 'execa'
import fs from 'fs-extra'
import { ignoreErrors, fromCallback } from 'promise-toolbox'
import { join } from 'path'
import { tmpdir } from 'os'

import LocalHandler from './local'
import { Syscall6 } from 'syscall'
import normalizePath from './_normalizePath'
import { randomBytes } from 'crypto'

const sudoExeca = (command, args, opts) =>
  execa('sudo', [command, ...args], opts)

const computeRate = (hrtime: number[], size: number) => {
  const seconds = hrtime[0] + hrtime[1] / 1e9
  return size / seconds
}

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
    this._keeper = undefined
    this._params = {
      ...params,
      options: [params.options, remote.options]
        .filter(_ => _ !== undefined)
        .join(','),
    }
    this._realPath = join(
      mountsDir,
      remote.id || Math.random().toString(36).slice(2)
    )
  }

  async _forget() {
    const keeper = this._keeper
    if (keeper === undefined) {
      return
    }
    this._keeper = undefined
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

  async test(): Promise<Object> {
    /**
     * @returns the number of byte effectively copied, needs to be called in a loop!
     */
    function copy_file_range(fdIn, offsetIn, fdOut, offsetOut, dataLen, flags = 0) {
      // we are stuck on linux x86_64
      function wrapOffset(offsetIn) {
        if (offsetIn == null)
          return 0
        const offsetInBuffer = new Uint32Array(2)
        new DataView(offsetInBuffer.buffer).setBigUint64(0, BigInt(offsetIn), true)
        return offsetInBuffer
      }

      const SYS_copy_file_range = 326
      const [ret, _, errno] = Syscall6(SYS_copy_file_range, fdIn, wrapOffset(offsetIn), fdOut, wrapOffset(offsetOut), data.byteLength, 0)
      if (errno !== 0) {
        throw new Error('Error no', errno)
      }
      return ret
    }

    const SIZE = 1024 * 1024 * 10
    const testFileName = normalizePath(`${Date.now()}.test`)
    const testFileName2 = normalizePath(`${Date.now()}__2.test`)
    const data = await fromCallback(randomBytes, SIZE)
    let step = 'write'
    try {
      const writeStart = process.hrtime()
      await this._outputFile(testFileName, data, { flags: 'wx' })
      const writeDuration = process.hrtime(writeStart)
      step = 'duplicate'
      const fd1 = await this._openFile(testFileName, 'r')
      const fd2 = await this._openFile(testFileName2, 'w')
      console.log('_openFile', fd1, fd2, data.byteLength)

      const res = copy_file_range(fd1, 0, fd2, null, data.byteLength, 0)
      console.log('copy_file_range', res)
      await this._closeFile(fd2)

      step = 'read'
      const readStart = process.hrtime()
      const read = await this._readFile(testFileName, { flags: 'r' })
      const readDuration = process.hrtime(readStart)

      if (!data.equals(read)) {
        throw new Error('output and input did not match')
      }
      return {
        success: true,
        writeRate: computeRate(writeDuration, SIZE),
        readRate: computeRate(readDuration, SIZE),
      }
    } catch (error) {
      return {
        success: false,
        step,
        file: testFileName,
        error: error.message || String(error),
      }
    } finally {
      ignoreErrors.call(this._unlink(testFileName))
    }
  }

  async _sync() {
    // in case of multiple `sync`s, ensure we properly close previous keeper
    {
      const keeper = this._keeper
      if (keeper !== undefined) {
        this._keeper = undefined
        ignoreErrors.call(fs.close(keeper))
      }
    }

    const realPath = this._getRealPath()

    await fs.ensureDir(realPath)

    try {
      const { type, device, options, env } = this._params

      // Linux mount is more flexible in which order the mount arguments appear.
      // But FreeBSD requires this order of the arguments.
      await this._execa(
        'mount',
        ['-o', options, '-t', type, device, realPath],
        {
          env: {
            LANG: 'C',
            ...env,
          },
        }
      )
    } catch (error) {
      try {
        // the failure may mean it's already mounted, use `findmnt` to check
        // that's the case
        await this._execa('findmnt', [realPath], {
          stdio: 'ignore',
        })
      } catch (_) {
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
