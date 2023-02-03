import _ from 'intl'
import React from 'react'
import PropTypes from 'prop-types'
import { groupBy } from 'lodash'

import BaseComponent from './base-component'
import { alert } from './modal'
import { createSelector } from './selectors'

const ICON_WARNING_MODAL_LEVEL = {
  danger: 1,
  warning: 2,
  success: 3,
}

class IconWarningModal extends BaseComponent {
  getSortedElements = createSelector(
    () => this.props.icons,
    icons => icons.sort((curr, next) => ICON_WARNING_MODAL_LEVEL[next.level] - ICON_WARNING_MODAL_LEVEL[curr.level])
  )

  getGroupedElements = createSelector(this.getSortedElements, elements => groupBy(elements, 'level'))

  getLowestLevelInfo = createSelector(this.getSortedElements, this.getGroupedElements, (sorted, grouped) => {
    const lowestLevel = sorted[sorted.length - 1]?.level
    return {
      length: grouped[lowestLevel]?.length,
      level: lowestLevel,
    }
  })

  onClick = () =>
    alert(
      _('alerts'),
      <div>
        {this.getSortedElements().map(({ level, render }, index) => (
          <p className={`text-${level}`} key={index}>
            {render}
          </p>
        ))}
      </div>
    )

  render() {
    const { level, length } = this.getLowestLevelInfo()

    return length !== 0 ? (
      // <a> in order to bypass the BlockLink component
      <a className={`icon-warning-modal ${level}`} onClick={this.onClick}>
        <span>{length}</span>
      </a>
    ) : null
  }
}

IconWarningModal.propTypes = {
  icons: PropTypes.arrayOf(
    PropTypes.exact({
      level: PropTypes.string.isRequired,
      render: PropTypes.element.isRequired,
    })
  ),
}

export default IconWarningModal
