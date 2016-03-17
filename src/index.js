import React from 'react'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { IntlProvider } from 'react-intl'

import DevTools from './dev-tools'
import store, { actions } from './store'
import XoApp from './xo-app'

if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function'
) {
  window.addEventListener('unhandledRejection', (reason) => {
    console.error(reason)
  })
}

store.dispatch(actions.connect())

render(
  <Provider store={store}>
    <IntlProvider locale='en'>
      <div>
        <XoApp />
        <DevTools />
      </div>
    </IntlProvider>
  </Provider>,
  document.getElementsByTagName('xo-app')[0]
)
