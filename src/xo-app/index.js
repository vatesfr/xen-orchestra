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

@routes(Home, [
  {
    path: 'about',
    component: About
  },
  {
    ...Vm.route,
    path: 'vms/:id'
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

    return <div className='container-fluid main'>
      <Navbar selectLang={(lang) => selectLang(lang)} />
      <div className='wrapper'>
        <Menu />
        <div className='view'>
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
