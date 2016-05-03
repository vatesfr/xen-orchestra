import React, { Component } from 'react'

export default class Header extends Component {
  render () {
    const { children } = this.props
    return <nav className='xo-header'>
      {children}
    </nav>
  }
}
