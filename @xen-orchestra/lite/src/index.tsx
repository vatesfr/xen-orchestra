import React from 'react'
import ReactDOM from 'react-dom'
import { Helmet } from 'react-helmet'
import { createGlobalStyle } from 'styled-components'

import App from './App/index'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: Arial, Verdana, Helvetica, Ubuntu, sans-serif;
    box-sizing: border-box;
    color: #212529;
  }
`

ReactDOM.render(
  <React.StrictMode>
    <Helmet>
      <link rel='shortcut icon' href='favicon.ico' />
    </Helmet>
    <GlobalStyle />
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
