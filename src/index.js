import React from 'react'
import Router from 'react-router/lib/Router'
import { IntlProvider } from 'messages'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import DevTools from './dev-tools'
import store, { history } from './store'
import XoApp from './xo-app'
import { connect } from './store/actions'

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('unhandledRejection', (reason) => {
    console.error(reason)
  })
}

store.dispatch(connect())

render(
  <Provider store={store}>
    <IntlProvider>
      <div>
        <Router history={history} routes={{ ...XoApp.route, path: '/' }} />
        {DevTools && <DevTools />}
      </div>
    </IntlProvider>
  </Provider>,
  document.getElementsByTagName('xo-app')[0]
)
