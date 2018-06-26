import _ from 'intl'
import React from 'react'

import ActionButton from './action-button'
import ActionRowButton from './action-row-button'
import propTypes from './prop-types-decorator'

export const CAN_REPORT_BUG = process.env.XOA_PLAN > 1

const reportBug = ({ title, message }) => {
  const encodedTitle = encodeURIComponent(title)
  const encodedMessage = encodeURIComponent(message)

  window.open(
    process.env.XOA_PLAN < 5
      ? `https://xen-orchestra.com/#!/member/support?title=${encodedTitle}&message=${encodedMessage}`
      : `https://github.com/vatesfr/xen-orchestra/issues/new?title=${encodedTitle}&body=${encodedMessage}`
  )
}

const ReportBugButton = ({ title, message, rowButton, ...props }) => {
  const Button = rowButton ? ActionRowButton : ActionButton
  return (
    <Button
      {...props}
      data-message={message}
      data-title={title}
      handler={reportBug}
      icon='bug'
      tooltip={_('reportBug')}
    />
  )
}

propTypes(ReportBugButton)({
  message: propTypes.string.isRequired,
  rowButton: propTypes.bool,
  title: propTypes.string.isRequired,
})

export default ReportBugButton
