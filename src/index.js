import DevTools from 'dev-tools'
import React from 'react'
import Router from 'react-router/lib/Router'
import store, { history } from 'store'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import XoApp from './xo-app'

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('unhandledRejection', reason => {
    console.error(reason)
  })
}

render(
  <Provider store={store}>
    <div>
      <Router history={history} routes={{
        ...XoApp.route,
        component: XoApp,
        path: '/'
      }} />
      {DevTools && <DevTools />}
    </div>
  </Provider>,
  document.getElementsByTagName('xo-app')[0]
)
