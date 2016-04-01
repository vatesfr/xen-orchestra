import React, { Component } from 'react'
import {
  connectStore,
  propTypes
} from 'utils'

import ActionBar from 'action-bar'

@connectStore([
  'user',
  'status'
])
@propTypes({
  selectLang: propTypes.func.isRequired
})
export default class Navbar extends Component {
  render () {
    const {
      user,
      status
    } = this.props
    return <nav className='navbar navbar-full navbar-fixed-top navbar-light bg-faded xo-navbar'>
      <ul className='nav navbar-nav'>
        <li>
          <a className='navbar-brand xo-brand' href='#'>Xen Orchestra</a>
        </li>
        <li className='nav-item pull-xs-right'>
          {status[0].toUpperCase() + status.slice(1)}{user && ` as ${user.email}`}
        </li>
        <li className='nav-item pull-xs-right'>
          <ActionBar style={{margin: '3px'}} actions={[
            {
              label: 'enLang',
              handler: () => this.props.selectLang('en')
            },
            {
              label: 'frLang',
              handler: () => this.props.selectLang('fr')
            }
          ]} />
        </li>
      </ul>
    </nav>
  }
}
