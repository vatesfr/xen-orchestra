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

import { Button } from 'react-bootstrap-4/lib'
import Icon from 'icon'

import About from './about'
import Home from './home'
import SignIn from './sign-in'
import Vm from './vm'

import Menu from './menu'

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
  componentWillMount () {
    this.setState({collapsed: false})
  }
  render () {
    const {
      children,
      user,
      signIn,
      selectLang,
      status
    } = this.props

    return <div className='container-fluid'>
      {this.state.collapsed ? null : <Menu />}
      <div style={{marginLeft: !this.state.collapsed && '10em'}}> {/* 10em: room for the left side menu bar */}
        <Button bsStyle='secondary' onClick={() => this.setState({...this.state, collapsed: !this.state.collapsed})}>
          <Icon icon='menu-collapse' />
        </Button>
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

        <p>{status}{user && ` as ${user.email}`}</p>

        {
          user == null
            ? <SignIn onSubmit={signIn} />
            : children
        }
      </div>
    </div>
  }
}
