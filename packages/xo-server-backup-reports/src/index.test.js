import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import createPlugin from './index.js'

// the result of a task aborted with `AbortController#abort()`, as serialized in the logs
const ABORT_ERROR = { name: 'AbortError', message: 'This operation was aborted', code: 20 }

// the plugin with an `xo` that only knows a VM, a remote and a user, and keeps the emails and Slack messages it sends
function createReporter() {
  const emails = []
  const slackMessages = []
  const xo = {
    getObject: id => ({ id, name_label: `name of ${id}`, uuid: id }),
    getRemote: async id => ({ id, name: `name of ${id}` }),
    getUser: async id => {
      if (id !== 'user-id') {
        throw new Error('no such user ' + id)
      }
      return { id, email: 'admin@admin.net' }
    },
    sendEmail: async email => {
      emails.push(email)
    },
    // the transports that receive the compact markdown template
    sendSlackMessage: async ({ message }) => {
      slackMessages.push(message)
    },
  }
  const plugin = createPlugin({ xo })
  plugin.configure({ toMails: ['admin@admin.net'] })
  return { emails, plugin, slackMessages }
}

// the info xo-server adds to the run when a user requests its abort
const abortRequestedInfo = (userId = 'user-id') => ({
  message: 'abort requested',
  data: { type: 'abortRequested', userId },
})

// the log of a backup run aborted while backing up its single VM
const abortedRunLog = () => ({
  id: 'run',
  jobId: 'job',
  data: { mode: 'delta', reportWhen: 'failure' },
  start: 1e12,
  end: 1e12 + 60e3,
  status: 'interrupted',
  result: ABORT_ERROR,
  infos: [{ message: 'vms', data: { vms: ['vm1'] } }, abortRequestedInfo()],
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

const ABORT_LINE = /abort requested by admin@admin\.net/

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

      it('shows who requested the abort in the HTML, and only this info of the run', async () => {
        const { emails, plugin } = createReporter()
        const log = abortedRunLog()
        log.data.backupReportTpl = backupReportTpl

        await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

        const [{ html }] = emails
        assert.match(html, ABORT_LINE)
        assert.doesNotMatch(html, /ℹ️ vms/)
      })
    })
  }

  it('shows who requested the abort in the markdown, full and compact', async () => {
    const { emails, plugin, slackMessages } = createReporter()

    await plugin._vmHandler(abortedRunLog(), { name: 'job', settings: { '': {} } })

    const [{ text }] = emails
    const [compactText] = slackMessages
    for (const markdown of [text, compactText]) {
      assert.match(markdown, ABORT_LINE)
      assert.doesNotMatch(markdown, /ℹ️ vms/)
    }
  })

  it('shows who requested the abort of a run aborted before any VM backup', async () => {
    const { emails, plugin, slackMessages } = createReporter()
    const log = abortedRunLog()
    delete log.tasks

    await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

    const [{ html, text }] = emails
    const [compactText] = slackMessages
    for (const report of [html, text, compactText]) {
      assert.match(report, ABORT_LINE)
    }
  })

  it('shows the id of the user who requested the abort when this user no longer exists', async () => {
    const { emails, plugin } = createReporter()
    const log = abortedRunLog()
    log.infos[1] = abortRequestedInfo('deleted-user-id')

    await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

    assert.match(emails[0].text, /abort requested by deleted-user-id/)
  })

  it('finds the abort request by the type of the info, not by its data', async () => {
    const { emails, plugin } = createReporter()
    const log = abortedRunLog()
    log.infos[1] = { message: 'some info', data: { userId: 'user-id' } }

    await plugin._vmHandler(log, { name: 'job', settings: { '': {} } })

    assert.doesNotMatch(emails[0].text, /abort requested by|some info/)
  })
})
