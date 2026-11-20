import { mkdir, open } from 'node:fs/promises'
import { join } from 'node:path'

// names written by `openRpuTrace()` in xo-server/src/_rpuObservability.mjs, also prevents writing outside of the directory
const TRACE_FILE_RE = /^rp[ru][\w-]*\.(?:ndjson|heartbeat\.json)$/

/**
 * rebuilds the RPU/RPR trace files from the `rpuTrace` lines of a bundle, which are grouped by file
 *
 * refuses to overwrite an existing file, to never mix the traces of two XOs
 *
 * @param {string} dir - traces directory of the XO
 */
export function createRpuTracesWriter(dir) {
  let current // { file, handle }
  let files = 0

  async function close() {
    if (current !== undefined) {
      const { handle } = current
      current = undefined
      await handle.close()
    }
  }

  return {
    get files() {
      return files
    },

    /** @param {{ file: string, data?: unknown, raw?: string }} line */
    async write({ file, data, raw }) {
      if (current?.file !== file) {
        if (!TRACE_FILE_RE.test(file)) {
          throw new Error(`invalid RPU trace file name: ${JSON.stringify(file)}`)
        }
        await close()
        await mkdir(dir, { recursive: true })
        current = { file, handle: await open(join(dir, file), 'wx') }
        ++files
      }
      await current.handle.write((raw ?? JSON.stringify(data)) + '\n')
    },

    close,
  }
}
