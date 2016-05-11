import React, { Component } from 'react'

export default class Header extends Component {
  render () {
    const { children } = this.props
    return <nav style={{
      backgroundColor: '#eee',
      padding: '0.6em',
      paddingBottom: '0',
      flexShrink: '0'
    }}>
      {children}
    </nav>
  }
}
