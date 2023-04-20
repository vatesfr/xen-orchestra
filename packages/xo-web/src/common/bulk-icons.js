import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'

import BaseComponent from './base-component'
import Icon from './icon'
import { alert } from './modal'
import { createSelector } from './selectors'

const ICON_WARNING_MODAL_LEVEL = {
  danger: 1,
  warning: 2,
  success: 3,
}

class BulkIcons extends BaseComponent {
  getSortedAlerts = createSelector(
    () => this.props.alerts,
    alerts =>
      alerts?.sort((curr, next) => ICON_WARNING_MODAL_LEVEL[curr.level] - ICON_WARNING_MODAL_LEVEL[next.level]) ?? []
  )

  onClick = () =>
    alert(
      _('alerts'),
      this.getSortedAlerts().map(({ level, render }, index) => (
        <div className={`text-${level}`} key={index}>
          {render}
        </div>
      ))
    )

  render() {
    const alerts = this.getSortedAlerts()
    const length = alerts.length
    const level = alerts[0]?.level

    return (
      length !== 0 && (
        // <a> in order to bypass the BlockLink component
        <a className='fa-stack' onClick={this.onClick} style={{ transform: 'scale(0.8)' }}>
          <Icon icon='alarm' color={`text-${level}`} className='fa-stack-2x' />
          {/* `fa-triangle` does not exist on FontAwesome4.`l` is used to fill the `!` of the `alarm` icon */}
          <span className={`fa-stack-2x font-weight-bold text-${level}`} style={{ fontSize: '2.3em' }}>
            l
          </span>
          <span className='fa-stack-1x text-white font-weight-bold'>{length}</span>
        </a>
      )
    )
  }
}

BulkIcons.propTypes = {
  alerts: PropTypes.arrayOf(
    PropTypes.exact({
      level: PropTypes.string.isRequired,
      render: PropTypes.element.isRequired,
    })
  ),
}

export default BulkIcons
