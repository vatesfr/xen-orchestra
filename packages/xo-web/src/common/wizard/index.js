import classNames from 'classnames'
import every from 'lodash/every'
import PropTypes from 'prop-types'
import React, { Component, cloneElement } from 'react'

import _ from '../intl'
import Icon from '../icon'

import styles from './index.css'

const Wizard = ({ children }) => {
  const allDone = every(React.Children.toArray(children), child => child.props.done || child.props.summary)

  return (
    <ul className={styles.wizard}>
      {React.Children.map(children, (child, key) => child && cloneElement(child, { allDone, key }))}
    </ul>
  )
}
export { Wizard as default }

export class Section extends Component {
  static propTypes = {
    icon: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }

  componentWillMount() {
    this.setState({ isActive: false })
  }

  _onFocus = () => this.setState({ isActive: true })
  _onBlur = () => this.setState({ isActive: false })

  render() {
    const { allDone, icon, title, done, children } = this.props
    return (
      <li
        className={classNames(styles.section, styles.bullet, (done || allDone) && styles.success)}
        onFocus={this._onFocus}
        onBlur={this._onBlur}
      >
        {/* TITLE */}
        <div className={classNames(styles.title, (done || allDone) && styles.success)}>
          <h4>
            {icon && <Icon icon={icon} />} {_(title)}
          </h4>
        </div>
        {/* CONTENT */}
        <div
          className={classNames(
            styles.content,
            this.state.isActive && styles.active,
            (done || allDone) && styles.success
          )}
        >
          {children}
        </div>
      </li>
    )
  }
}
