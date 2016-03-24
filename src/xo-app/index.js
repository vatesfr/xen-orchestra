import _ from 'messages'
import React, {
  Component
} from 'react'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  IndexLink,
  IndexRoute,
  Link,
  Route,
  Router
} from 'react-router'
import {
  connectStore,
  propTypes
} from 'utils'

import About from './about'
import Home from './home'
import SignIn from './sign-in'
import Vm from './vm'
import {
  history
} from '../store'

@connectStore([
  'user',
  'status'
])
@propTypes({
  children: propTypes.node.isRequired
})
class XoApp extends Component {
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

export default () => <Router history={history}>
  <Route path='/' component={XoApp}>
    <IndexRoute component={Home} />
    <Route path='about' component={About} />
    <Route path='vms/:id' component={Vm} />
  </Route>
</Router>
