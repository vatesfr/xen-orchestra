import _ from 'messages'
import classNames from 'classnames'
import every from 'lodash/every'
import Icon from 'icon'
import map from 'lodash/map'
import { propTypes } from 'utils'
import React, { Component, cloneElement } from 'react'

import styles from './index.css'

const Wizard = ({ children }) => {
  const allDone = every(React.Children.toArray(children), (child) => child.props.done || child.props.summary)
  return <ul className={styles.wizard}>
    {map(React.Children.toArray(children), (child, key) => cloneElement(child, { allDone, key }))}
  </ul>
}
export { Wizard as default }

@propTypes({
  allDone: propTypes.bool,
  done: propTypes.bool,
  icon: propTypes.string.isRequired,
  title: propTypes.string.isRequired
})
export class Section extends Component {
  componentWillMount () {
    this.setState({isActive: false})
  }
  render () {
    const {
      allDone,
      icon,
      title,
      done,
      children
    } = this.props
    return (
      <li
        className={classNames(
          styles.section,
          styles.bullet,
          (done || allDone) && styles.success
        )}
        onFocus={() => this.setState({ isActive: true })}
        onBlur={() => this.setState({ isActive: false })}
      >
        {/* TITLE */}
        <div className={classNames(
          styles.title,
          (done || allDone) && styles.success
        )}>
          <h4>{icon && <Icon icon={icon} />} {_(title)}</h4>
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
