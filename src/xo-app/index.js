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
  componentWillMount () {
    this.setState({collapsed: false})
  }
  render () {
    const {
      children,
      user,
      signIn,
      selectLang
    } = this.props

    return <div className='container-fluid'>
      <Navbar selectLang={(lang) => selectLang(lang)} />
      <Menu collapsed={this.state.collapsed} setCollapse={(collapsed) => this.setState({...this.state, collapsed})}/>
      {/* 60px: room for the navbar - 3em/12em: room for the collapsed/uncollapsed left side menu */}
      <div className='main' style={{marginTop: '60px', marginLeft: this.state.collapsed ? '3em' : '12em'}}>
        {
          user == null
            ? <SignIn onSubmit={signIn} />
            : children
        }
      </div>
    </div>
  }
}
