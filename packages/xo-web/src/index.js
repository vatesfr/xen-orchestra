import './patch-react'

import hashHistory from 'react-router/lib/hashHistory'
import React from 'react'
import Router from 'react-router/lib/Router'
import store from 'store'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import XoApp from './xo-app'

render(
  <Provider store={store}>
    <Router
      history={hashHistory}
      routes={{
        ...XoApp.route,
        component: XoApp,
        path: '/',
      }}
    />
  </Provider>,
  document.getElementById('xo-app')
)
