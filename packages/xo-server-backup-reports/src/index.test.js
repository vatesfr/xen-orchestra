import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import createPlugin from './index.js'

// the result of a task aborted with `AbortController#abort()`, as serialized in the logs
const ABORT_ERROR = { name: 'AbortError', message: 'This operation was aborted', code: 20 }

// the plugin with an `xo` that only knows a VM and a remote, and keeps the emails it sends
function createReporter() {
  const emails = []
  const xo = {
    getObject: id => ({ id, name_label: `name of ${id}`, uuid: id }),
    getRemote: async id => ({ id, name: `name of ${id}` }),
    sendEmail: async email => {
      emails.push(email)
    },
  }
  const plugin = createPlugin({ xo })
  plugin.configure({ toMails: ['admin@admin.net'] })
  return { emails, plugin }
}

// the log of a backup run aborted while backing up its single VM
const abortedRunLog = () => ({
  id: 'run',
  jobId: 'job',
  data: { mode: 'delta', reportWhen: 'failure' },
  start: 1e12,
  end: 1e12 + 60e3,
  status: 'interrupted',
  result: ABORT_ERROR,
  infos: [
    { message: 'vms', data: { vms: ['vm1'] } },
    { message: 'abort requested by admin@admin.net', data: { userId: 'user-id' } },
  ],
  tasks: [
    {
      data: { type: 'VM', id: 'vm1' },
      message: 'backup VM',
      start: 1e12,
      end: 1e12 + 60e3,
      status: 'interrupted',
      result: ABORT_ERROR,
      tasks: [],
    },
  ],
})

describe('report of a VM backup', () => {
  for (const backupReportTpl of ['mjml', 'compactMjml']) {
    describe(`with the ${backupReportTpl} template`, () => {
      it('lists an aborted VM as interrupted, not as failed', async () => {
        const { emails, plugin } = createReporter()
        const log = abortedRunLog()
        log.data.backupReportTpl = backupReportTpl

        await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

        const [{ text }] = emails
        assert.match(text, /1 Interrupted/)
        assert.doesNotMatch(text, /Failure/)
        assert.match(text, /Successes\*\*: 0 \/ 1/)
      })

      it('shows who requested the abort, and only this info of the run', async () => {
        const { emails, plugin } = createReporter()
        const log = abortedRunLog()
        log.data.backupReportTpl = backupReportTpl

        await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

        const [{ html, text }] = emails
        assert.match(text, /abort requested by admin@admin\.net/)
        assert.match(html, /abort requested by admin@admin\.net/)
        assert.doesNotMatch(text, /ℹ️ vms/)
      })
    })
  }

  it('finds who aborted the run by the user id of the info, not by its wording', async () => {
    const { emails, plugin } = createReporter()
    const log = abortedRunLog()
    log.infos[1].message = 'stopped by admin@admin.net'

    await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

    assert.match(emails[0].text, /stopped by admin@admin\.net/)
  })
})
