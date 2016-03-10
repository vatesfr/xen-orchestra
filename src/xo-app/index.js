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

@connect(pick([]), actions)
class XoApp extends Component {
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
        </ul>

        <p>{this.props.user}</p>

        {this.props.children}
      </div>
    )
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
