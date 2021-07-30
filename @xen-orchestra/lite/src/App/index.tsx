import Cookies from 'js-cookie'
import React from 'react'
import styled from 'styled-components'
import { IntlProvider } from 'react-intl'
import { HashRouter as Router, Switch, Route, Link } from 'react-router-dom'
import { Map } from 'immutable'
import { withState } from 'reaclette'

import Button from '../components/Button'
import IntlMessage from '../components/IntlMessage'
import messagesEn from '../lang/en.json'
import PoolTab from './PoolTab'
import Signin from './Signin/index'
import StyleGuide from './StyleGuide/index'
import TabConsole from './TabConsole'
import XapiConnection, { ObjectsByType, Vm } from '../libs/xapi'

const Version = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  opacity: .5;
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
  vms?: Map<string, Vm>
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
      vms: state =>
        state.objectsFetched
          ? state.objectsByType
              ?.get('VM')
              ?.filter((vm: Vm) => !vm.is_control_domain && !vm.is_a_snapshot && !vm.is_a_template)
          : undefined,
      url: state => `${window.location.protocol}//${state.xapiHostname}`,
    },
  },
  ({ effects, state }) => (
    <IntlProvider messages={messagesEn} locale='en'>
      {!state.connected ? (
        <Signin />
      ) : !state.objectsFetched ? (
        <IntlMessage id='loading' />
      ) : (
        <>
          <Button onClick={() => effects.disconnect()}>
            <IntlMessage id='disconnect' />
          </Button>
          <Router>
            <Switch>
              <Route exact path='/styleguide'><StyleGuide /></Route>
              <Route exact path='/'>
                <p>There are {state.objectsByType?.size || 0} types!</p>
                <Link to='/pool'>Pool</Link>
                {state.vms !== undefined && (
                  <>
                    <p>There are {state.vms.size} VMs!</p>
                    <ul>
                      {state.vms.valueSeq().map((vm: Vm) => (
                        <li key={vm.$id}>
                          <Link to={vm.$id}>
                            {vm.name_label} - {vm.name_description} ({vm.power_state})
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Route>
              <Route path='/pool'>
                <PoolTab />
              </Route>
              <Route path='/:id' render={({ match }) => <TabConsole vmId={match.params.id} />} />
            </Switch>
          </Router>
        </>
      )}
      <Version>v{process.env.NPM_VERSION}</Version>
    </IntlProvider>
  )
)

export default App
