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
import {
  actions,
  history
} from '../store'

let XoApp = class extends Component {
  static propTypes = {
    children: PropTypes.node,
    counter: PropTypes.number
  };

  render () {
    return (
      <div>
        <ul>
          <li><Link to='/about'>About</Link></li>
          <li><IndexLink to='/'>Home</IndexLink></li>
          <li><button onClick={() => this.props.signIn({
            email: 'admin@admin.net',
            password: 'admin'
          })}>Sign in</button></li>
          <li><button onClick={() => this.props.signOut()}>Sign out</button></li>
        </ul>

        <p>{this.props.user}</p>

        {this.props.children}
      </div>
    )
  }
}

XoApp = connect(pick([
  'counter',
  'user'
]), actions)(XoApp)

export default () => <div>
  <h1>Xen Orchestra</h1>

  <Router history={history}>
    <Route path='/' component={XoApp}>
      <IndexRoute component={Home} />
      <Route path='/about' component={About} />
    </Route>
  </Router>
</div>
