import React, { Component } from 'react'

export default class Navbar extends Component {
  render () {
    const { children } = this.props
    return <nav className='xo-navbar'>
      {children}
    </nav>
  }
}
