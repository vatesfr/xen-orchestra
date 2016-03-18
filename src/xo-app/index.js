import _ from 'messages'
import React, {
  Component,
  PropTypes
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
  connectStore
} from 'utils'

import About from './about'
import Home from './home'
import SignIn from './sign-in'
import {
  history
} from '../store'

@connectStore([
  'user',
  'status'
])
class XoApp extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  render () {
    const {
      children,
      user,
      signIn,
      selectLang,
      status
    } = this.props

    return <div>
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
  </Route>
</Router>
