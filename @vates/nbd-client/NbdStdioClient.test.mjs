import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import NbdStdioClient from './NbdStdioClient.mjs'

describe('NbdStdioClient', () => {
  it('reports what the server wrote on stderr when it dies before the handshake', async () => {
    // the end of stdout and the exit of the process come in either order: repeat
    for (let i = 0; i < 20; i++) {
      const client = new NbdStdioClient({ command: 'sh', args: ['-c', 'echo "the actual reason" >&2; exit 1'] })
      await assert.rejects(client.connect(), { code: 'NBD_SERVER_EXITED', exitCode: 1, message: 'the actual reason' })
    }
  })
})
