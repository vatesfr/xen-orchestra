import React, { Component, PropTypes } from 'react'
import { connect } from 'react-redux'
import { Link, Route, IndexLink, IndexRoute } from 'react-router'
import { ReduxRouter } from 'redux-router'

import About from './about'
import Home from './home'
import { actions } from '../store'

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
          <li><button onClick={ () => this.props.signIn({
            email: 'admin@admin.net',
            password: 'admin'
          }) }>Sign in</button></li>
          <li><button onClick={ () => this.props.signOut() }>Sign out</button></li>
          <li><button onClick={ this.props.increment }>Increment</button></li>
          <li><button onClick={ this.props.decrement }>Decrement</button></li>
        </ul>

        <p>{ this.props.user }</p>
        <p>{ this.props.counter }</p>

        { this.props.children }
      </div>
    )
  }
}

const pick = propNames => object => {
  const props = {}
  for (const name of propNames) {
    props[name] = object[name]
  }
  return props
}

XoApp = connect(pick([
  'counter',
  'user'
]), actions)(XoApp)

export default () => <div>
  <h1>Xen Orchestra</h1>

  <ReduxRouter>
    <Route path='/' component={ XoApp }>
      <IndexRoute component={ Home } />
      <Route path='/about' component={ About } />
    </Route>
  </ReduxRouter>
</div>
