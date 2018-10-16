import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'

import ActionButton from './action-button'
import ActionRowButton from './action-row-button'

export const CAN_REPORT_BUG = process.env.XOA_PLAN > 1

const reportBug = ({ formatMessage, message, title }) => {
  const encodedTitle = encodeURIComponent(title)
  const encodedMessage = encodeURIComponent(
    formatMessage !== undefined ? formatMessage(message) : message
  )

  window.open(
    process.env.XOA_PLAN < 5
      ? `https://xen-orchestra.com/#!/member/support?title=${encodedTitle}&message=${encodedMessage}`
      : `https://github.com/vatesfr/xen-orchestra/issues/new?title=${encodedTitle}&body=${encodedMessage}`
  )
}

const ReportBugButton = ({
  formatMessage,
  message,
  rowButton,
  title,
  ...props
}) => {
  const Button = rowButton ? ActionRowButton : ActionButton
  return (
    <Button
      {...props}
      data-formatMessage={formatMessage}
      data-message={message}
      data-title={title}
      handler={reportBug}
      icon='bug'
      tooltip={_('reportBug')}
    />
  )
}

ReportBugButton.propTypes = {
  formatMessage: PropTypes.func,
  message: PropTypes.string.isRequired,
  rowButton: PropTypes.bool,
  title: PropTypes.string.isRequired,
}

export { ReportBugButton as default }
