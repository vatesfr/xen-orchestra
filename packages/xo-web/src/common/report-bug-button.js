import _ from 'intl'
import * as xoaPlans from 'xoa-plans'
import decorate from 'apply-decorators'
import defined from '@xen-orchestra/defined'
import PropTypes from 'prop-types'
import React from 'react'
import stripAnsi from 'strip-ansi'
import xoaUpdater from 'xoa-updater'
import { checkXoa, getApplianceInfo } from 'xo'
import { createBlobFromString } from 'utils'
import { createLogger } from '@xen-orchestra/log'
import { identity, omit } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { post } from 'fetch'
import { timeout } from 'promise-toolbox'

import ActionButton from './action-button'
import ActionRowButton from './action-row-button'

const ADDITIONAL_FILES_FETCH_TIMEOUT = 5e3

const jsonStringify = json => JSON.stringify(json, null, 2)
const logger = createLogger('report-bug-button')

const GITHUB_URL = 'https://github.com/vatesfr/xen-orchestra/issues/new'
const XO_SUPPORT_URL = 'https://xen-orchestra.com/#!/member/support'
const SUPPORT_PANEL_URL = './api/support/create/ticket'

const ADDITIONAL_FILES = [
  {
    fetch: () => xoaUpdater.getLocalManifest().then(jsonStringify),
    name: 'manifest.json',
  },
  {
    fetch: () => checkXoa().then(stripAnsi),
    name: 'xoaCheck.txt',
  },
  {
    fetch: () => getApplianceInfo().then(jsonStringify),
    name: 'xoaInfo.json',
  },
]

const reportInNewWindow = (url, { title, message, formatMessage = identity }) => {
  const encodedTitle = encodeURIComponent(title == null ? '' : title)
  const encodedMessage = encodeURIComponent(message == null ? '' : formatMessage(message))
  window.open(`${url}?title=${encodedTitle}&body=${encodedMessage}`)
}

export const reportOnSupportPanel = async ({ files = [], formatMessage = identity, message, title } = {}) => {
  const { FormData, open } = window

  const formData = new FormData()
  if (title !== undefined) {
    formData.append('title', title)
  }
  if (message !== undefined) {
    formData.append('message', formatMessage(message))
  }
  files.forEach(({ content, name }) => {
    formData.append('attachments', content, name)
  })

  await Promise.all(
    ADDITIONAL_FILES.map(({ fetch, name }) =>
      timeout.call(fetch(), ADDITIONAL_FILES_FETCH_TIMEOUT).then(
        file => formData.append('attachments', createBlobFromString(file), name),
        error => logger.warn(`cannot get ${name}`, error)
      )
    )
  )

  try {
    const res = await timeout.call(post(SUPPORT_PANEL_URL, formData), 1e4)
    if (res.status !== 200) {
      throw new Error(`not a valid response status (${res.status})`)
    }
    open(await res.text())
  } catch (error) {
    logger.warn('cannot get the new ticket URL', { error })
    reportInNewWindow(XO_SUPPORT_URL, {
      title: defined(title, 'Bug report'),
      message,
      formatMessage,
    })
  }
}

export const reportBug =
  xoaPlans.CURRENT === xoaPlans.SOURCES ? params => reportInNewWindow(GITHUB_URL, params) : reportOnSupportPanel

const REPORT_BUG_BUTTON_PROP_TYPES = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.oneOfType([PropTypes.instanceOf(window.Blob), PropTypes.instanceOf(window.File)]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  formatMessage: PropTypes.func,
  message: PropTypes.string,
  rowButton: PropTypes.bool,
  title: PropTypes.string,
}

const ReportBugButton = decorate([
  provideState({
    effects: {
      async reportBug() {
        const { files, formatMessage, message, title } = this.props
        await reportBug({
          files,
          formatMessage,
          message,
          title,
        })
      },
    },
    computed: {
      Button: (state, { rowButton }) => (rowButton ? ActionRowButton : ActionButton),
      buttonProps: (state, props) => omit(props, Object.keys(REPORT_BUG_BUTTON_PROP_TYPES)),
    },
  }),
  injectState,
  ({ state, effects }) => (
    <state.Button {...state.buttonProps} handler={effects.reportBug} icon='bug' tooltip={_('reportBug')} />
  ),
])

ReportBugButton.propTypes = REPORT_BUG_BUTTON_PROP_TYPES

export { ReportBugButton as default }
