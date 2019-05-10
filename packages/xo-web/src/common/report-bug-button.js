import _ from 'intl'
import currentPlan, { XOA_PLAN_FREE, XOA_PLAN_SOURCES } from 'plans'
import decorate from 'apply-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import xoaUpdater from 'xoa-updater'
import { createBinaryFile } from 'utils'
import { identity, omit } from 'lodash'
import { injectState, provideState } from 'reaclette'
import { post } from 'fetch'

import ActionButton from './action-button'
import ActionRowButton from './action-row-button'

export const CAN_REPORT_BUG = currentPlan > XOA_PLAN_FREE
const SUPPORT_PANEL_URL = './api/support/create/ticket'

const reportOnGithub = ({ formatMessage, message, title }) => {
  const encodedTitle = encodeURIComponent(title == null ? '' : title)
  const encodedMessage = encodeURIComponent(
    message == null
      ? ''
      : formatMessage === undefined
      ? message
      : formatMessage(message)
  )

  window.open(
    `https://github.com/vatesfr/xen-orchestra/issues/new?title=${encodedTitle}&body=${encodedMessage}`
  )
}

const reportOnSupportPanel = async ({
  files = [],
  formatMessage = identity,
  message,
  title,
}) => {
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

  formData.append(
    'attachments',
    createBinaryFile(
      JSON.stringify(await xoaUpdater.getLocalManifest(), null, 2)
    ),
    'manifest.json'
  )

  const res = await post(SUPPORT_PANEL_URL, formData)
  if (res.status !== 200) {
    throw new Error('cannot get the new ticket URL')
  }
  open(await res.text())
}

export const reportBug =
  currentPlan === XOA_PLAN_SOURCES ? reportOnGithub : reportOnSupportPanel

const REPORT_BUG_BUTTON_PROP_TYPES = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      content: PropTypes.oneOfType([
        PropTypes.instanceOf(window.Blob),
        PropTypes.instanceOf(window.File),
      ]).isRequired,
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
      Button: (state, { rowButton }) =>
        rowButton ? ActionRowButton : ActionButton,
      buttonProps: (state, props) =>
        omit(props, Object.keys(REPORT_BUG_BUTTON_PROP_TYPES)),
    },
  }),
  injectState,
  ({ state, effects }) => (
    <state.Button
      {...state.buttonProps}
      handler={effects.reportBug}
      icon='bug'
      tooltip={_('reportBug')}
    />
  ),
])

ReportBugButton.propTypes = REPORT_BUG_BUTTON_PROP_TYPES

export { ReportBugButton as default }
