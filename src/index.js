import React from 'react'
import { Provider } from 'react-redux'
import { render } from 'react-dom'

import store from './store'
import XoApp from './xo-app'

render(
  <Provider store={ store }>
    <XoApp />
  </Provider>,
  document.getElementsByTagName('xo-app')[0]
)
