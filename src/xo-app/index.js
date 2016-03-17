import pick from 'lodash/fp/pick'
import React, {
  Component,
  PropTypes
} from 'react'
// import {
//   keyHandler
// } from 'react-key-handler'
import {
  connect
} from 'react-redux'
import {
  IndexLink,
  IndexRoute,
  Link,
  Route,
  Router
} from 'react-router'

import About from './about'
import Home from './home'
import SignIn from './sign-in'
import {
  actions,
  history
} from '../store'

@connect(pick([
  'user',
  'status'
]), actions)
class XoApp extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  componentDidMount () {
    this.props.connect()
  }

  render () {
    const {
      children,
      user,
      signIn,
      status
    } = this.props
    return <div>
      <ul>
        <li><Link to='/about'>About</Link></li>
        <li><IndexLink to='/'>Home</IndexLink></li>
      </ul>

      <p>{status}</p>
      <p>{JSON.stringify(user)}</p>

      {
        user == null
          ? <SignIn onSubmit={signIn} />
          : children
      }
    </div>
  }
}

export default () => <div>
  <h1>Xen Orchestra</h1>

  <Router history={history}>
    <Route path='/' component={XoApp}>
      <IndexRoute component={Home} />
      <Route path='/about' component={About} />
    </Route>
  </Router>
</div>
