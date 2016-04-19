import React, { Component } from 'react'

export default class Navbar extends Component {
  render () {
    const { children } = this.props
    return <div>
      <nav style={{maxHeight: '10em'}} className='xo-navbar'>
        {children}
      </nav>
      <div style={{height: '10em'}}></div>
    </div>
  }
}
