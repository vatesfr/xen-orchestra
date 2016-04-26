import _ from 'messages'
import classNames from 'classnames'
import React from 'react'
import Icon from 'icon'

const Wizard = ({ children }) => (
  <ul style={{
    margin: '1em',
    listStyleType: 'circle'
  }}
  >
    {children}
  </ul>
)
Wizard.propTypes = {
  // children: React.PropTypes.arrayOf(
  //   React.PropTypes.instanceOf(Section)
  // ).isRequired
}
export default Wizard

export const Section = ({ icon, title, column, summary, children }) => (
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
Section.propTypes = {
  icon: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
  children: React.PropTypes.node.isRequired
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
Item.propTypes = {
  label: React.PropTypes.string,
  children: React.PropTypes.node
}
