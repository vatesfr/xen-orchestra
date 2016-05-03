import _ from 'messages'
import classNames from 'classnames'
import React, { Component } from 'react'
import Icon from 'icon'

export default class Wizard extends Component {
  componentWillMount () {
    this.setState({activeElement: document.activeElement})
  }
  render () {
    const { children } = this.props
    return (
      <ul style={{
        margin: '1em'
      }}
      >
        {children}
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
    document.addEventListener('focusin', () => {
      this.setState({isActive: section.contains(document.activeElement)})
    })
    document.addEventListener('focusout', () => {
      this.setState({isActive: section.contains(document.activeElement)})
    })
  }
  render () {
    const {
      icon,
      title,
      column,
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
          !summary && 'bullet-not-last'
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
            flex: summary ? '1 1 20em' : '1 1 40em',
            border: 'solid 2px',
            borderColor: this.state.isActive ? '#333' : '#aaa',
            padding: '0.5em',
            display: 'flex',
            flexWrap: 'wrap',
            flexDirection: column ? 'column' : 'row',
            minWidth: '15em',
            fontSize: summary ? '2em' : '1em',
            justifyContent: summary && 'space-around',
            alignItems: 'baseline'
          }}
          className={classNames(
          'form-inline'
          )}
        >
          {children}
        </div>
      </li>
    )
  }
}

export const LineItem = ({ children }) => (
  <div style={{
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap'
  }}>
    {children}
  </div>
)

export const Item = ({ label, children }) => (
  <span style={{whiteSpace: 'nowrap', margin: '0.5em'}}>
    {label && <span><label>{_(label)}</label>&nbsp;&nbsp;</span>}
    {children}
  </span>
)

// Proptypes

// Wizard.propTypes = {
//   children: React.PropTypes.arrayOf(
//     React.PropTypes.instanceOf(Section)
//   ).isRequired
// }
Section.propTypes = {
  icon: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  children: React.PropTypes.node.isRequired
}
Item.propTypes = {
  label: React.PropTypes.string,
  children: React.PropTypes.node
}
