import React, {
  Component
} from 'react'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  connectStore,
  propTypes,
  routes
} from 'utils'

import About from './about'
import Home from './home'
import SignIn from './sign-in'
import Vm from './vm'

import Menu from './menu'
import Navbar from './navbar'
import Settings from './settings'
import Dashboard from './dashboard'

@routes('home', [
  {
    path: 'about',
    component: About
  },
  {
    ...Home.route,
    path: 'home'
  },
  {
    ...Vm.route,
    path: 'vms/:id'
  },
  {
    ...Settings.route,
    path: 'settings'
  },
  {
    ...Dashboard.route,
    path: 'dashboard'
  }
])
@connectStore([
  'user'
])
@propTypes({
  children: propTypes.node.isRequired
})
export default class XoApp extends Component {
  render () {
    const {
      children,
      user,
      signIn,
      selectLang
    } = this.props

    return <div className='xo-main'>
      <Navbar selectLang={(lang) => selectLang(lang)} />
      <div className='xo-navbar-substitute'>&nbsp;</div>
      <div className='xo-body'>
        <Menu />
        <div className='xo-content'>
          {
            user == null
              ? <SignIn onSubmit={signIn} />
              : children
          }
        </div>
      </div>
    </div>
  }
}
