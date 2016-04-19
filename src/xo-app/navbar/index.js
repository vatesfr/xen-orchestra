import React, { Component } from 'react'

export default class Navbar extends Component {
  render () {
    const { children } = this.props
    return <div>
      <nav className='xo-navbar'>
        {children}
      </nav>
    </div>
  }
}
