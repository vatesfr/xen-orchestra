// @flow

import React from 'react'
import { Provider } from 'react-redux'
import { render } from 'react-dom'
import { IntlProvider } from 'react-intl'

import DevTools from './dev-tools'
import store from './store'
import XoApp from './xo-app'

render(
  <Provider store={store}>
    <IntlProvider>
      <div>
        <XoApp />
        <DevTools />
      </div>
    </IntlProvider>
  </Provider>,
  document.getElementsByTagName('xo-app')[0]
)
