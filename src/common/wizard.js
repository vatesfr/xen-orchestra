import _ from 'messages'
import classNames from 'classnames'
import every from 'lodash/every'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component, cloneElement } from 'react'

import styles from './wizard.css'

const Wizard = ({ children }) => {
  const allDone = every(React.Children.toArray(children), (child) => child.props.done || child.props.summary)
  return <ul className={styles.wizard}>
    {map(children, (child, key) => cloneElement(child, { allDone, key }))}
  </ul>
}
export { Wizard as default }

export class Section extends Component {
  componentWillMount () {
    this.setState({isActive: false})
  }
  componentDidMount () {
    const section = this.refs.section
    section.addEventListener('focus', () => {
      this.setState({isActive: section.contains(section.ownerDocument.activeElement)})
    }, true)
    section.addEventListener('blur', () => {
      this.setState({isActive: section.contains(section.ownerDocument.activeElement)})
    }, true)
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
        ref='section'
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
