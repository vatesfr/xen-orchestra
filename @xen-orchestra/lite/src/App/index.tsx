import Cookies from 'js-cookie'
import React from 'react'
import styled from 'styled-components'
import { FormattedMessage, IntlProvider } from 'react-intl'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import { withState } from 'reaclette'

import Button from '../components/Button'
import Infrastructure from './Infrastructure'
import IntlMessage from '../components/IntlMessage'
import messagesEn from '../lang/en.json'
import XapiConnection, { ObjectsByType } from '../libs/xapi'
import PoolTab from './PoolTab'
import Signin from './Signin/index'
import StyleGuide from './StyleGuide/index'

const Version = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  opacity: 0.5;
`
interface ParentState {
  objectsByType: ObjectsByType
  xapi: XapiConnection
}

interface State {
  connected: boolean
  error: React.ReactNode
  xapiHostname: string
}

interface Props {}

interface ParentEffects {}

interface Effects {
  connectToXapi: (password: string, rememberMe: boolean) => void
  disconnect: () => void
}

interface Computed {
  objectsFetched: boolean
  url: string
}

const App = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    initialState: () => ({
      connected: Cookies.get('sessionId') !== undefined,
      error: '',
      objectsByType: undefined,
      xapi: undefined,
      xapiHostname: process.env.XAPI_HOST || window.location.host,
    }),
    effects: {
      initialize: async function () {
        const xapi = (this.state.xapi = new XapiConnection())

        xapi.on('connected', () => {
          this.state.connected = true
        })

        xapi.on('disconnected', () => {
          this.state.connected = false
        })

        xapi.on('objects', (objectsByType: ObjectsByType) => {
          this.state.objectsByType = objectsByType
        })

        try {
          await xapi.reattachSession(this.state.url)
        } catch (err) {
          if (err.code !== 'SESSION_INVALID') {
            throw err
          }

          console.log('Session ID is invalid. Asking for credentials.')
        }
      },
      connectToXapi: async function (password, rememberMe = false) {
        try {
          await this.state.xapi.connect({
            url: this.state.url,
            user: 'root',
            password,
            rememberMe,
          })
        } catch (err) {
          if (err.code !== 'SESSION_AUTHENTICATION_FAILED') {
            throw err
          }

          this.state.error = <IntlMessage id='badCredentials' />
        }
      },
      disconnect: async function () {
        await this.state.xapi.disconnect()
        this.state.connected = false
      },
    },
    computed: {
      objectsFetched: state => state.objectsByType !== undefined,
      url: state => `${window.location.protocol}//${state.xapiHostname}`,
    },
  },
  ({ effects, state }) => {
    return (
      <>
        <IntlProvider messages={messagesEn} locale='en'>
          {!state.connected ? (
            <Signin />
          ) : !state.objectsFetched ? (
            <IntlMessage id='loading' />
          ) : (
            <>
              <Button onClick={() => effects.disconnect()}>
                <FormattedMessage id='disconnect' />
              </Button>
              <Router>
                <Switch>
                  <Route exact path='/styleguide'>
                    <StyleGuide />
                  </Route>
                  <Route exact path='/pool'>
                    <PoolTab />
                  </Route>
                  <Route exact path='/infrastructure'>
                    <Infrastructure />
                  </Route>
                  <Route
                    path='/infrastructure/vms/:id/console'
                    render={({ match: { params } }) => <Infrastructure vmId={params.id} />}
                  />
                </Switch>
              </Router>
            </>
          )}
          <Version>v{process.env.NPM_VERSION}</Version>
        </IntlProvider>
      </>
    )
  }
)

export default App
