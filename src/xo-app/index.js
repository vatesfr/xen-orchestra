import _ from 'messages'
import IndexLink from 'react-router/lib/IndexLink'
import Link from 'react-router/lib/Link'
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
  'user',
  'status'
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
      selectLang,
      status
    } = this.props

    return <div className='container-fluid'>
      <h1>Xen Orchestra</h1>

      <p>
        <button
          type='button'
          onClick={() => selectLang('en')}
        >en</button>
        <button
          type='button'
          onClick={() => selectLang('fr')}
        >fr</button>
      </p>

      <ul>
        <li><Link to='/about'>{_('aboutPage')}</Link></li>
        <li><IndexLink to='/'>{_('homePage')}</IndexLink></li>
      </ul>

      <p>{status}{user && ` as ${user.email}`}</p>

      {
        user == null
          ? <SignIn onSubmit={signIn} />
          : children
      }
    </div>
  }
}
