import React, { Component } from 'react'

export default class Header extends Component {
  render () {
    const { children } = this.props
    return <div>
      <nav className='xo-header'>
        {children}
      </nav>
    </div>
  }
}
