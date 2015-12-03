import React, { Component, PropTypes } from 'react'
import { Link, Route } from 'react-router'
import { ReduxRouter } from 'redux-router'

import About from './about'
import Home from './home'

class XoApp extends Component {
  // static propTypes = {
  //   children: PropTypes.node
  // }

  render () {
    return (
      <div>
        <ul>
          <li><Link to='/about'>About</Link></li>
          <li><Link to='/home'>Home</Link></li>
        </ul>

        { this.props.children }
      </div>
    )
  }
}

export default () => <div>
  <h1>Xen Orchestra</h1>

  <ReduxRouter>
    <Route path='/' component={ XoApp }>
      <Route path='/about' component={ About } />
      <Route path='/home' component={ Home } />
    </Route>
  </ReduxRouter>

</div>
