import _ from 'intl'
import PropTypes from 'prop-types'
import React from 'react'
import { findDOMNode } from 'react-dom'

import BaseComponent from './base-component'
import { alert } from './modal'
import { createSelector } from './selectors'

const ICON_WARNING_MODAL_LEVEL = {
  danger: 1,
  warning: 2,
  success: 3,
}

class BulkIcons extends BaseComponent {
  componentDidMount() {
    // eslint-disable-next-line react/no-find-dom-node
    findDOMNode(this)?.parentElement.classList.add('align-self-center')
  }

  getSortedElements = createSelector(
    () => this.props.icons,
    icons =>
      icons?.sort((curr, next) => ICON_WARNING_MODAL_LEVEL[next.level] - ICON_WARNING_MODAL_LEVEL[curr.level]) ?? []
  )

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
    const elements = this.getSortedElements()
    const length = elements.length
    const level = elements[length - 1]?.level

    return (
      length !== 0 && (
        // <a> in order to bypass the BlockLink component
        <a className={`bulk-icons-triangle ${level}`} onClick={this.onClick}>
          <span>{length}</span>
        </a>
      )
    )
  }
}

BulkIcons.propTypes = {
  icons: PropTypes.arrayOf(
    PropTypes.exact({
      level: PropTypes.string.isRequired,
      render: PropTypes.element.isRequired,
    })
  ),
}

export default BulkIcons
