import React, {
  Component,
  cloneElement
} from 'react'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  connectStore,
  propTypes,
  routes
} from 'utils'
import Header from './header'

import About from './about'
import Home from './home'
import Host from './host'
import SignIn from './sign-in'
import Vm from './vm'

import Dashboard from './dashboard'
import Menu from './menu'
import Settings from './settings'

@routes('home', {
  about: About,
  dashboard: Dashboard,
  home: Home,
  'hosts/:id': Host,
  settings: Settings,
  'vms/:id': Vm
})
@connectStore([
  'user'
])
@propTypes({
  children: propTypes.node.isRequired
})
export default class XoApp extends Component {
  componentWillReceiveProps () {
    this.menuHeight = document.getElementById('xo-menu-content').offsetHeight
  }

  render () {
    const {
      children,
      user,
      signIn
    } = this.props

    const refs = this.refs

    return <div className='xo-main'>
      <Menu />
      <div className='xo-body' style={{minHeight: this.menuHeight}}>
        <Header>
          {
            refs.child && refs.child.getWrappedInstance
              ? refs.child.getWrappedInstance().header && refs.child.getWrappedInstance().header()
              : refs.child && refs.child.header && refs.child.header()
          }
        </Header>
        <div className='xo-content'>
          {
            user == null
              ? <SignIn onSubmit={signIn} />
              : cloneElement(children, {ref: 'child'})
          }
        </div>
      </div>
    </div>
  }
}
