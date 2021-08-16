import Cookies from 'js-cookie'
import React from 'react'
import styled from 'styled-components'
import { FormattedMessage, IntlProvider } from 'react-intl'
import { HashRouter as Router, Switch, Route } from 'react-router-dom'
import { withState } from 'reaclette'

import Button from '../components/Button'
import IntlMessage from '../components/IntlMessage'
import ListObjects from './ListObjects'
import messagesEn from '../lang/en.json'
import Signin from './Signin/index'
import StyleGuide from './StyleGuide/index'
import TabConsole from './TabConsole'
import XapiConnection, { ObjectsByType } from '../libs/xapi'

const LeftView = styled.div`
  background: #f5f5f5;
  float: left;
  height: ${props => props.height + 'px'};
  overflow-y: scroll;
  width: 24%;
`

const RightView = styled.div`
  float: left;
  height: ${props => props.height + 'px'};
  overflow-y: scroll;
  width: 75%;
`

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
  windowHeight: number
}

interface Props {}

interface ParentEffects {}

interface Effects {
  connectToXapi: (password: string, rememberMe: boolean) => void
  disconnect: () => void
  resizeWindow: () => void
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
      windowHeight: window.innerHeight,
      xapi: undefined,
      xapiHostname: process.env.XAPI_HOST || window.location.host,
    }),
    effects: {
      initialize: async function () {
        window.addEventListener('resize', this.effects.resizeWindow)
        this.effects.resizeWindow()

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
      finalize: function () {
        window.removeEventListener('resize', this.effects.resizeWindow)
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
      resizeWindow() {
        this.state.windowHeight = window.innerHeight
      },
    },
    computed: {
      objectsFetched: state => state.objectsByType !== undefined,
      url: state => `${window.location.protocol}//${state.xapiHostname}`,
    },
  },
  ({ effects, state }) => {
    const _listObjects = (
      <LeftView height={state.windowHeight}>
        <ListObjects />
      </LeftView>
    )

    return (
      <>
        <IntlProvider messages={messagesEn} locale='en'>
          {!state.connected ? (
            <Signin />
          ) : !state.objectsFetched ? (
            <FormattedMessage id='loading' />
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
                  <Route exact path='/'>
                    {_listObjects}
                  </Route>
                  <Route
                    path='/vms/:id/console'
                    render={({ match }) => (
                      <>
                        {_listObjects}
                        <RightView height={state.windowHeight}>
                          <TabConsole vmId={match.params.id} />
                        </RightView>
                      </>
                    )}
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
