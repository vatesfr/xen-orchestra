import _ from 'intl'
import ActionRowButton from 'action-row-button'
import ActionButton from 'action-button'
import propTypes from './prop-types-decorator'
import React from 'react'

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
      handler={reportBug}
      data-title={title}
      data-message={message}
      icon='bug'
      tooltip={_('reportBug')}
    />
  )
}

const commonPropType = propTypes.oneOfType([propTypes.string, propTypes.node])
  .isRequired

propTypes(ReportBugButton)({
  title: commonPropType,
  message: commonPropType,
  rowButton: propTypes.bool,
})

export default ReportBugButton
