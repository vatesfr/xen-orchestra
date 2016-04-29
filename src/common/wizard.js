import _ from 'messages'
import classNames from 'classnames'
import React, { cloneElement, Component } from 'react'
import Icon from 'icon'
import map from 'lodash/map'

export default class Wizard extends Component {
  componentWillMount () {
    this.setState({activeElement: document.activeElement})
    document.addEventListener('click', () => {
      this.setState({activeElement: document.activeElement})
      console.log(this.state.activeElement)
    })
  }
  render () {
    const { children } = this.props
    return (
      <ul style={{
        margin: '1em'
      }}
      >
        <div>
          {map(children, (child, index) => cloneElement(child, { key: index, activeElement: this.state.activeElement }))}
        </div>
      </ul>
    )
  }
}

export class Section extends Component {
  componentWillMount () {
    this.setState({isActive: false})
  }
  componentDidMount () {
    this.setState({isActive: this.refs.section.contains(this.props.activeElement)})
    document.addEventListener('click', () => {
      this.setState({isActive: this.refs.section.contains(this.props.activeElement)})
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
          <h4 style={{color: this.state.isActive && 'green'}}>{icon && <Icon icon={icon} />} {_(title)}</h4>
        </div>
        {/* CONTENT */}
        <div
          style={{
            flex: summary ? '1 1 20em' : '1 1 40em',
            border: 'solid 2px #aaa',
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
