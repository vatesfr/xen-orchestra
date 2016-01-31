import React, { Component, PropTypes } from 'react'
import { connect, Provider } from 'react-redux'
import store from '../store'
import LoginForm from './login/loginForm.js'
import VMForm from './vm/form.js'
import { Router, Route, Link } from 'react-router'
// from https://github.com/rackt/react-router/blob/master/upgrade-guides/v2.0.0.md#no-default-history
import { hashHistory } from 'react-router'


const Dashboard = React.createClass({
  render() {
    return <div>Welcome to the app!</div>
  }
})

const App = React.createClass({
  render() {
    return (
      <div>
        <ul>
          <li><Link to="/vm/create">createvm</Link></li>
          <li><Link to="/inbox">Inbox</Link></li>
        </ul>
        {this.props.children}
      </div>
    )
  }
})



const Inbox = React.createClass({
  render() {
    return (
      <div>
        <h2>Inbox</h2>
        {this.props.children || "Welcome to your Inbox"}
      </div>
    )
  }
})


const Message = React.createClass({
  render() {
    return <h3>Message {this.props.params.id}</h3>
  }
})


class XoAppUnconnected extends Component {
  render () {
    const {isLoggued, login, password, userId} = this.props
    return (
      <div>
         <h2> Xen Orchestra {login} {isLoggued ? 'connecté' : ' non connecté'}</h2>
         {!isLoggued &&
            <LoginForm />
         }
         {isLoggued &&
              <Router  history={hashHistory}>
                <Route path="/" component={App}>
                  <Route path="vm/:vmId" component={ VMForm } />
                  <Route path="inbox" component={Inbox}>
                    <Route path="messages/:id" component={Message} />
                  </Route>
                </Route>
              </Router>
         }
      </div>
    )
  }
}
const XoApp = connect(state => state.session)(XoAppUnconnected)

/*
 * Provider allow the compontn directly bellow XoApp to have acces to the store
 * and to the  dispatch method
*/
export default () =>
  <Provider store={ store }>
    <XoApp/>
  </Provider>
/*

import About from './about'
import Home from './home'
import CreateVm from './create-vm'
//import CreatVM from './create-vm'

class XoApp extends Component {
  static propTypes = {
    children: PropTypes.node
  };

  render () {

  }

  _do (action) {
    return () => this.props.dispatch(action)
  }
}

XoApp = connect(state => state)(XoApp)

export default () => <div>
  <h1>Xen Orchestra</h1>

  <ReduxRouter>
    <Route path='/' component={ XoApp }>
      <IndexRoute component={ Home } />
      <Route path='/about' component={ About } />
      <Route path='/create-vm' component={ CreateVm } />
    </Route>
  </ReduxRouter>
</div>*/
