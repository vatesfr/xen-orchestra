import _ from 'messages'
import classNames from 'classnames'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component, cloneElement } from 'react'

export default class Wizard extends Component {
  render () {
    const { children } = this.props
    const allDone = children.every((child) => child.props.done || child.props.summary)
    return (
      <ul style={{
        margin: '1em'
      }}
      >
        {map(children, (child, key) => cloneElement(child, { allDone, key }))}
      </ul>
    )
  }
}

export class Section extends Component {
  componentWillMount () {
    this.setState({isActive: false})
  }
  componentDidMount () {
    const section = this.refs.section
    section.addEventListener('focusin', () => {
      this.setState({isActive: section.contains(section.ownerDocument.activeElement)})
    })
    section.addEventListener('focusout', () => {
      this.setState({isActive: section.contains(section.ownerDocument.activeElement)})
    })
  }
  render () {
    const {
      allDone,
      icon,
      title,
      done,
      summary,
      children
    } = this.props
    return (
      <li
        style={{
          paddingBottom: '1em',
          display: 'flex',
          flexWrap: 'wrap'
        }}
        className={classNames(
          'bullet',
          !summary && 'bullet-not-last',
          (done || allDone) && 'bullet-done'
        )}
        ref='section'
      >
        {/* TITLE */}
        <div style={{
          flex: '0 0 15em'
        }}>
          <h4>{icon && <Icon icon={icon} />} {_(title)}</h4>
        </div>
        {/* CONTENT */}
        <div
          style={{
            border: 'solid 2px',
            borderColor: this.state.isActive ? '#333' : '#aaa',
            flex: '1 1 40em',
            minWidth: '15em',
            padding: '0.5em'
          }}
        >
          {children}
        </div>
      </li>
    )
  }
}
